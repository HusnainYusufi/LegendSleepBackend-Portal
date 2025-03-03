const express = require("express");
const router = express.Router();
const CsrTicketService = require("../services/CsrTicketService");
const UserTicketService = require("../services/UserTicketService");
const { verifyToken } = require("../modules/helper"); // Import verifyToken for extracting user data
const logger = require("../modules/logger");
const Notification = require('../models/Notification.model');
const UserTicket = require('../models/UserTicket.model');
const CsrTicket = require('../models/CsrTicket.model');
const Company = require('../models/Company.Model');
const Driver = require('../models/Driver.Model');
const upload = require('../services/multerService'); 

// Route to add a CSR tickets aded
// Route to add a CSR ticket with image upload support
router.post("/csr/add", upload.array('images', 10), async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing." });
    }
    
    const verifiedToken = await verifyToken(token);
    const userId = verifiedToken.data.user;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token." });
    }

    // Add the user ID to the createdBy field in the ticket data
    req.body.createdBy = userId;
    req.body.reason = req.body.reason || null; // Optional field for reason

    // Handle uploaded images: if files are provided, map them to their stored paths
    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map(file => file.path);
    } else {
      req.body.images = null;
    }

    // Create the CSR ticket using the service
    const result = await CsrTicketService.addTicket(req.body);
    logger.info('CSR ticket creation result:', result);

    // Generate a notification for CSR leads
    const notificationMessage = `A new CSR ticket has been created: ${result.result.ordernumber}`;
    const notification = new Notification({
      message: notificationMessage,
      ticketId: result.result._id,
      createdBy: userId,
    });

    await notification.save();
    logger.info('Notification created successfully:', notification);

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
      const { fees, procedure, condition, employee , city } = req.body;
      
      // Prepare the CSR ticket data object
      const csrTicketData = {
        ordernumber,
        problem,
        fees,
        procedure,
        condition,
        city,
        // Use employee from payload if provided, otherwise fallback (e.g., to userId)
        employee: employee || userId,
        createdBy: userId // This is taken from the token
      };
      
      // Create the new CSR ticket using the service
      const csrTicketResult = await CsrTicketService.addTicket(csrTicketData);
      if (csrTicketResult.status !== 201) {
        return res.status(csrTicketResult.status).json(csrTicketResult);
      }
      // Generate a notification for CSR leads
      const notificationMessage = `A new CSR ticket has been generated from a user ticket: ${csrTicketResult.result.ordernumber}`;
      const notification = new Notification({
          message: notificationMessage,
          ticketId: csrTicketResult.result._id,
          createdBy: userId,
      });

      // Save the notification
      await notification.save();

      // Log the saved notification
      logger.info('Notification created successfully:', notification);

      
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

// Route to mark a CSR ticket as attended and update additional fields
router.post("/csr/attend/:ticketId", async (req, res, next) => {
  try {
    // Extract token
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing." });
    }

    // Verify token
    const verifiedToken = await verifyToken(token);
    const userId = verifiedToken.data.user;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token." });
    }

    const ticketId = req.params.ticketId;
    const ticketData = req.body;
    if (!verifiedToken?.data?.userType || verifiedToken?.data?.userType.toLowerCase() !== 'csrlead') {
      logger.error('Unauthorized access attempt in Ticketcontroller - /attend-csrlead:', {
          userId: verifiedToken?.data?.userId || 'Unknown',
          email: verifiedToken?.data?.email || 'Unknown',
          ipAddress: req.ip || req.connection.remoteAddress
      });
      return res.status(403).json({ message: 'Access denied. Only CSR Lead can attend Leads.' });
  }
    // Call service to update ticket
    const result = await CsrTicketService.attendTicket(ticketId, userId, ticketData);
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error("Error in TicketController - /csr/attend:", {
      message: error.message,
      stack: error.stack,
      ticketId: req.params.ticketId,
      ipAddress: req.ip || req.connection.remoteAddress,
    });
    next(error);
  }
});

// Route to get all notifications for CSR leads
router.get("/csr/notifications", async (req, res, next) => {
  try {
    // Fetch all unread notifications and populate the createdBy field
    const notifications = await Notification.find({ isRead: false })
      .populate("ticketId") // Populate the ticketId field
      .populate({
        path: "createdBy", // Populate the createdBy field
        select: "username email", // Include only specific fields from the User model
      });

    return res.status(200).json({
      status: 200,
      message: "Notifications fetched successfully.",
      data: notifications,
    });
  } catch (error) {
    logger.error("Error in TicketController - /csr/notifications:", {
      message: error.message,
      stack: error.stack,
    });
    next(error);
  }
});

// Route to mark a notification as read
router.post("/csr/notifications/mark-as-read/:notificationId", async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    // Find the notification and mark it as read
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      status: 200,
      message: "Notification marked as read.",
      data: notification,
    });
  } catch (error) {
    logger.error("Error in TicketController - /csr/notifications/mark-as-read:", {
      message: error.message,
      stack: error.stack,
    });
    next(error);
  }
});

router.get("/stats/counts", async (req, res) => {
  try {
    const [
      totalUserTickets,
      totalCsrTickets,
      attendedTickets,
      unattendedTickets,
      totalCompanies,
      totalDrivers,
      unreadNotifications
    ] = await Promise.all([
      UserTicket.countDocuments(),
      CsrTicket.countDocuments(),
      CsrTicket.countDocuments({ attendedStatus: "attended" }),
      CsrTicket.countDocuments({ attendedStatus: "pending" }),
      Company.countDocuments(),
      Driver.countDocuments(),
      Notification.countDocuments({ isRead: false }),
    ]);

    return res.json({
      totalTickets: totalUserTickets + totalCsrTickets,
      totalUserTickets,
      totalCsrTickets,
      totalAttendedTickets: attendedTickets,
      totalUnattendedTickets: unattendedTickets,
      totalCompanies,
      totalDrivers,
      totalUnreadNotifications: unreadNotifications,
    });
  } catch (error) {
    console.error("Error fetching counts:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post('/csr/update-ticket-status/:ticketId', async (req, res, next) => {
  try {
      // Extract the ticket ID from the route parameter
      const ticketId = req.params.ticketId;

      // Extract the new status from the request body
      const { ticketStatus } = req.body;

      // Validate the input
      if (!ticketStatus || typeof ticketStatus !== 'string') {
          return res.status(400).json({ message: 'Invalid ticketStatus provided.' });
      }
      const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing." });
    }

    // Verify token
    const verifiedToken = await verifyToken(token);
    const userId = verifiedToken.data.user;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token." });
    }

    const ticketData = req.body;
    if (!verifiedToken?.data?.userType || verifiedToken?.data?.userType.toLowerCase() !== 'csrlead') {
      logger.error('Unauthorized access attempt in Ticketcontroller - /attend-csrlead:', {
          userId: verifiedToken?.data?.userId || 'Unknown',
          email: verifiedToken?.data?.email || 'Unknown',
          ipAddress: req.ip || req.connection.remoteAddress
      });
      return res.status(403).json({ message: 'Access denied. Only CSR Lead can attend Leads.' });
  }

      // Call the service to update the ticket status
      const result = await CsrTicketService.updateTicketStatus(ticketId, ticketStatus);

      // Return the response
      return res.status(result.status).json(result);
  } catch (error) {
      logger.error('Error in TicketController - /csr/update-ticket-status:', {
          message: error.message,
          stack: error.stack,
          ticketId: req.params.ticketId,
          body: req.body,
          ipAddress: req.ip || req.connection.remoteAddress,
      });
      next(error);
  }
});
  

module.exports = router;
