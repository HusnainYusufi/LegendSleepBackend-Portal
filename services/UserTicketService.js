const UserTicket = require("../models/UserTicket.model");
const logger = require("../modules/logger");

class UserTicketService {
  /**
   * Adds a new User ticket.
   * @param {Object} ticketData - Ticket data including email, phoneNumber, ordernumber, and problem.
   * @returns {Object} Response with status, message, and created ticket.
   */
  static async addTicket(ticketData) {
    try {
      // Create a new User ticket
      const newTicket = new UserTicket(ticketData);
      const savedTicket = await newTicket.save();

      return {
        status: 201,
        message: "User ticket created successfully.",
        result: savedTicket,
      };
    } catch (error) {
      logger.error("Error in UserTicketService - addTicket:", {
        message: error.message,
        stack: error.stack,
        data: ticketData,
      });
      return {
        status: 500,
        message: "Failed to create user ticket.",
        error: error.message,
      };
    }
  }

  /**
   * Retrieves all User tickets.
   * @returns {Object} Response with status, message, and an array of tickets.
   */
  static async getAllTickets() {
    try {
      const tickets = await UserTicket.find().sort({ createdAt: -1 });
      return {
        status: 200,
        message: "User tickets fetched successfully.",
        result: tickets,
      };
    } catch (error) {
      logger.error("Error in UserTicketService - getAllTickets:", {
        message: error.message,
        stack: error.stack,
      });
      return {
        status: 500,
        message: "Failed to fetch user tickets.",
        error: error.message,
      };
    }
  }
}

module.exports = UserTicketService;
