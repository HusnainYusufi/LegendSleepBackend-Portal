const CsrTicket = require("../models/CsrTicket.model");
const logger = require("../modules/logger");
const Notification = require('../models/Notification.model'); 

class CsrTicketService {
  /**
   * Adds a new CSR ticket.
   * @param {Object} ticketData - Ticket data including ordernumber, problem, fees, employee, procedure, condition (optional) and createdBy.
   * @returns {Object} Response with status, message, and created ticket.
   */
  static async addTicket(ticketData) {
    try {
      // Log the ticket data being received
      logger.info('Creating CSR ticket with data:', ticketData);
  
      // Create a new CSR ticket
      const newTicket = new CsrTicket(ticketData);
      const savedTicket = await newTicket.save();
  
      // Log the saved ticket
      logger.info('CSR ticket created successfully:', savedTicket);
  
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
      // Find the ticket
      const ticket = await CsrTicket.findById(ticketId);
      if (!ticket) {
        return { status: 404, message: "Ticket not found." };
      }

      if (ticket.attendedStatus === "attended") {
        return { status: 400, message: "Ticket is already attended." };
      }

      // Update fields
      ticket.attendedStatus = "attended";
      ticket.attendedBy = userId;
      ticket.newProduct = ticketData.newProduct || null;
      ticket.attemptDate = ticketData.attemptDate || null;
      ticket.qty = ticketData.qty || null;
      ticket.pkgs = ticketData.pkgs || null;
      ticket.shippingCompany = ticketData.shippingCompany || null;
      ticket.trackingNo = ticketData.trackingNo || null;
      ticket.driver = ticketData.driver || null;
      ticket.date = ticketData.date || null;
      ticket.ticketStatus = ticketData.ticketStatus || null;
      ticket.notes = ticketData.notes || null;

      await ticket.save();

      return { status: 200, message: "Ticket marked as attended.", ticket };
    } catch (error) {
      console.error("Error in CsrTicketService.attendTicket:", error);
      return { status: 500, message: "Internal server error." };
    }
  }
}

module.exports = CsrTicketService;
