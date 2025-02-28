const CsrTicket = require("../models/CsrTicket.model");
const logger = require("../modules/logger");
const Notification = require("../models/Notification.model");

class CsrTicketService {
  /**
   * Adds a new CSR ticket.
   * @param {Object} ticketData - Ticket data including ordernumber, problem, fees, employee, procedure, condition (optional) and createdBy.
   * @returns {Object} Response with status, message, and created ticket.
   */
  static async addTicket(ticketData) {
    try {
      // Log the ticket data being received
      logger.info("Creating CSR ticket with data:", ticketData);

      // Create a new CSR ticket
      const newTicket = new CsrTicket(ticketData);
      const savedTicket = await newTicket.save();

      // Log the saved ticket
      logger.info("CSR ticket created successfully:", savedTicket);

      return {
        status: 201,
        message: "CSR ticket created successfully.",
        result: savedTicket,
      };
    } catch (error) {
      logger.error("Error in CsrTicketService - addTicket:", {
        message: error.message,
        stack: error.stack,
        data: ticketData,
      });
      return {
        status: 500,
        message: "Failed to create CSR ticket.",
        error: error.message,
      };
    }
  }

  /**
   * Retrieves all CSR tickets.
   * @returns {Object} Response with status, message, and an array of tickets.
   */
  static async getAllTickets() {
    try {
      const tickets = await CsrTicket.find()
        .populate("createdBy attendedBy shippingCompany driver")
        .sort({ createdAt: -1 });
      return {
        status: 200,
        message: "CSR tickets fetched successfully.",
        result: tickets,
      };
    } catch (error) {
      logger.error("Error in CsrTicketService - getAllTickets:", {
        message: error.message,
        stack: error.stack,
      });
      return {
        status: 500,
        message: "Failed to fetch CSR tickets.",
        error: error.message,
      };
    }
  }

  /**
   * Updates a CSR ticket's status from pending to completed.
   * @param {String} ticketId - The ID of the ticket to update.
   * @returns {Object} Response with status, message, and updated ticket data.
   */
  static async updateTicketStatus(ticketId) {
    try {
      const ticket = await CsrTicket.findById(ticketId);
      if (!ticket) {
        return { status: 404, message: "Ticket not found." };
      }

      // Only update if the current status is pending
      if (ticket.status !== "pending") {
        return {
          status: 400,
          message: "Ticket status cannot be updated because it is not pending.",
        };
      }

      ticket.status = "completed";
      const updatedTicket = await ticket.save();

      return {
        status: 200,
        message: "Ticket status updated to completed.",
        result: updatedTicket,
      };
    } catch (error) {
      logger.error("Error in CsrTicketService - updateTicketStatus:", {
        message: error.message,
        stack: error.stack,
        ticketId,
      });
      return {
        status: 500,
        message: "Failed to update ticket status.",
        error: error.message,
      };
    }
  }

  // Mark ticket as attended and update fields
  static async attendTicket(ticketId, userId, ticketData) {
    try {
      let ticket = await CsrTicket.findById(ticketId);
      if (!ticket) {
        // Ticket not found – create a new ticket with provided data.
        const newTicketData = {
          ...ticketData,
          attendedStatus: "attended",
          attendedBy: userId,
          status: "completed"
        };
        // You might need to ensure required fields (e.g., ordernumber, problem) are included in ticketData.
        const newTicket = new CsrTicket(newTicketData);
        const savedTicket = await newTicket.save();
        return { 
          status: 201, 
          message: "Ticket not found. A new ticket has been created and marked as attended.",
          ticket: savedTicket 
        };
      }
      
      // Ticket exists – update provided fields if present.
      if (ticketData.hasOwnProperty('newProduct')) {
        ticket.newProduct = ticketData.newProduct;
      }
      if (ticketData.hasOwnProperty('attemptDate')) {
        ticket.attemptDate = ticketData.attemptDate;
      }
      if (ticketData.hasOwnProperty('qty')) {
        ticket.qty = ticketData.qty;
      }
      if (ticketData.hasOwnProperty('pkgs')) {
        ticket.pkgs = ticketData.pkgs;
      }
      if (ticketData.hasOwnProperty('shippingCompany')) {
        ticket.shippingCompany = ticketData.shippingCompany;
      }
      if (ticketData.hasOwnProperty('trackingNo')) {
        ticket.trackingNo = ticketData.trackingNo;
      }
      if (ticketData.hasOwnProperty('driver')) {
        ticket.driver = ticketData.driver;
      }
      if (ticketData.hasOwnProperty('date')) {
        ticket.date = ticketData.date;
      }
      if (ticketData.hasOwnProperty('ticketStatus')) {
        ticket.ticketStatus = ticketData.ticketStatus;
      }
      if (ticketData.hasOwnProperty('notes')) {
        ticket.notes = ticketData.notes;
      }
      
      // Always update attendance-related fields
      ticket.attendedStatus = "attended";
      ticket.attendedBy = userId;
      ticket.status = "completed";
  
      const updatedTicket = await ticket.save();
      return { 
        status: 200, 
        message: "Ticket updated and marked as attended.",
        ticket: updatedTicket 
      };
    } catch (error) {
      console.error("Error in CsrTicketService.attendTicket:", error);
      return { status: 500, message: "Internal server error." };
    }
  }
  
  /**
   * Updates the ticketStatus of a CSR ticket.
   * @param {String} ticketId - The ID of the ticket to update.
   * @param {String} ticketStatus - The new status to set for the ticket.
   * @returns {Object} - Response with status, message, and updated ticket.
   */
  static async updateTicketStatus(ticketId, ticketStatus) {
    try {
      // Validate the ticketStatus input
      if (!ticketStatus || typeof ticketStatus !== "string") {
        return { status: 400, message: "Invalid ticketStatus provided." };
      }

      // Find the ticket by ID
      const ticket = await CsrTicket.findById(ticketId);
      if (!ticket) {
        return { status: 404, message: "Ticket not found." };
      }

      // Update the ticketStatus field
      ticket.ticketStatus = ticketStatus;
      const updatedTicket = await ticket.save();

      // Log the update
      logger.info(`Ticket status updated for ticket ID: ${ticketId}`, {
        oldStatus: ticket.ticketStatus,
        newStatus: updatedTicket.ticketStatus,
      });

      return {
        status: 200,
        message: "Ticket status updated successfully.",
        result: updatedTicket,
      };
    } catch (error) {
      logger.error("Error in CsrTicketService - updateTicketStatus:", {
        message: error.message,
        stack: error.stack,
        ticketId,
        ticketStatus,
      });
      return {
        status: 500,
        message: "Failed to update ticket status.",
        error: error.message,
      };
    }
  }
}

module.exports = CsrTicketService;
