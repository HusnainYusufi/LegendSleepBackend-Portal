const CsrTicket = require("../models/CsrTicket.model");
const logger = require("../modules/logger");

class CsrTicketService {
  /**
   * Adds a new CSR ticket.
   * @param {Object} ticketData - Ticket data including ordernumber, problem, fees, employee, procedure, condition (optional) and createdBy.
   * @returns {Object} Response with status, message, and created ticket.
   */
  static async addTicket(ticketData) {
    try {
      // Create a new CSR ticket (status defaults to 'pending' as defined in the model)
      const newTicket = new CsrTicket(ticketData);
      const savedTicket = await newTicket.save();

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
        .populate("createdBy")
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
}

module.exports = CsrTicketService;
