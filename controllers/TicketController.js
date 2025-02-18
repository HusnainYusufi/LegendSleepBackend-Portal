const express = require("express");
const router = express.Router();
const CsrTicketService = require("../services/CsrTicketService");
const UserTicketService = require("../services/UserTicketService");
const { verifyToken } = require("../modules/helper"); // Import verifyToken for extracting user data
const logger = require("../modules/logger");

// Route to add a CSR tickets aded
router.post("/csr/add", async (req, res, next) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing." });
    }

    // Verify the token and extract the user
    const verifiedToken = await verifyToken(token);
    // Depending on your token structure, adjust accordingly.
    // Here we assume the user object is stored in verifiedToken.data.user or userId in verifiedToken.data.
    const userId = verifiedToken.data.user;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token." });
    }

    // Add the user ID to the createdBy field in the ticket data
    req.body.createdBy = userId;

    // Proceed to add the CSR ticket
    const result = await CsrTicketService.addTicket(req.body);
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error("Error in TicketController - /csr/add:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      ipAddress: req.ip || req.connection.remoteAddress,
    });
    next(error);
  }
});

// Route to add a User ticket (no authentication required)
router.post("/user/add", async (req, res, next) => {
  try {
    const result = await UserTicketService.addTicket(req.body);
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error("Error in TicketController - /user/add:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      ipAddress: req.ip || req.connection.remoteAddress,
    });
    next(error);
  }
});

// Route to get all CSR tickets
router.get("/csr/getall", async (req, res, next) => {
  try {
    const result = await CsrTicketService.getAllTickets();
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error("Error in TicketController - /csr/getall:", {
      message: error.message,
      stack: error.stack,
      ipAddress: req.ip || req.connection.remoteAddress,
    });
    next(error);
  }
});

// Route to get all User tickets
router.get("/user/getall", async (req, res, next) => {
  try {
    const result = await UserTicketService.getAllTickets();
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error("Error in TicketController - /user/getall:", {
      message: error.message,
      stack: error.stack,
      ipAddress: req.ip || req.connection.remoteAddress,
    });
    next(error);
  }
});

// Route to update CSR ticket status from pending to completed
router.post("/csr/updatestatus/:ticketId", async (req, res, next) => {
  try {
    // Extract the ticket ID from the route parameter
    const ticketId = req.params.ticketId;

    // Optionally, you can add authentication here if needed

    // Call the CSR Ticket Service to update the ticket status
    const result = await CsrTicketService.updateTicketStatus(ticketId);
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error("Error in TicketController - /csr/updatestatus:", {
      message: error.message,
      stack: error.stack,
      ticketId: req.params.ticketId,
      ipAddress: req.ip || req.connection.remoteAddress,
    });
    next(error);
  }
});

// Route to generate a CSR ticket from an existing user ticket
router.post('/csr/generateFromUser/:userTicketId', async (req, res, next) => {
    try {
      // Extract token from the Authorization header
      const token = req.headers['authorization']?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Authentication token missing.' });
      }
      
      // Verify the token and extract the user's ID
      const verifiedToken = await verifyToken(token);
      const userId = verifiedToken.data.user;
      if (!userId) {
        return res.status(401).json({ message: 'Invalid token.' });
      }
      
      // Get the user ticket ID from the route parameter
      const userTicketId = req.params.userTicketId;
      
      // Import the UserTicket model here (or at the top if preferred)
      const UserTicket = require('../models/UserTicket.model');
      
      // Find the user ticket by its ID
      const userTicket = await UserTicket.findById(userTicketId);
      if (!userTicket) {
        return res.status(404).json({ message: 'User ticket not found.' });
      }
      
      // Copy common details from the user ticket
      const { ordernumber, problem } = userTicket;
      
      // Get additional CSR ticket fields from the request body
      // Expecting fees, procedure, and condition; employee is optional.
      const { fees, procedure, condition, employee } = req.body;
      
      // Prepare the CSR ticket data object
      const csrTicketData = {
        ordernumber,
        problem,
        fees,
        procedure,
        condition,
        // Use employee from payload if provided, otherwise fallback (e.g., to userId)
        employee: employee || userId,
        createdBy: userId // This is taken from the token
      };
      
      // Create the new CSR ticket using the service
      const csrTicketResult = await CsrTicketService.addTicket(csrTicketData);
      if (csrTicketResult.status !== 201) {
        return res.status(csrTicketResult.status).json(csrTicketResult);
      }
      
      // Delete the original user ticket after successful CSR ticket creation
      await UserTicket.findByIdAndDelete(userTicketId);
      
      return res.status(201).json({
        status: 201,
        message: 'User ticket converted to CSR ticket successfully.',
        result: csrTicketResult.result
      });
    } catch (error) {
      logger.error('Error in TicketController - /csr/generateFromUser:', {
        message: error.message,
        stack: error.stack,
        userTicketId: req.params.userTicketId,
        ipAddress: req.ip || req.connection.remoteAddress
      });
      next(error);
    }
  });
  

module.exports = router;
