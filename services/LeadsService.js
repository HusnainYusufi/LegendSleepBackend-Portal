const Leads = require("../models/Leads.model"); // Import the Leads model
const logger = require("../modules/logger"); // Import the logger
const LeadAssignment = require("../models/LeadAssignment.model");
const LeadDiscussion = require("../models/LeadDiscussion.model");
const LeadActivity = require("../models/LeadActivity.model");

class LeadsService {
  /**
   * Add a new lead to the database
   * @param {Object} leadData - Data for the lead being added
   * @param {String} createdBy - User ID of the person creating the lead
   * @returns {Object} - Result of the operation
   */
  static async addLead(leadData, createdBy) {
    try {
      // Add the createdBy field to the lead data
      leadData.CreatedBy = createdBy;

      // Create a new lead instance
      const newLead = new Leads(leadData);

      // Save the lead to the database
      const savedLead = await newLead.save();

      // Log the successful creation of the lead
      logger.info("Lead successfully added", {
        leadId: savedLead._id,
        createdBy: createdBy,
        name: leadData.Name,
      });

      return {
        status: 201,
        message: "Lead added successfully.",
        data: savedLead,
      };
    } catch (error) {
      // Log the error if the lead creation fails
      logger.error("Error adding lead:", {
        message: error.message,
        stack: error.stack,
        leadData,
        createdBy,
      });

      return {
        status: 500,
        message: "Failed to add lead. Please try again later.",
        error: error.message,
      };
    }
  }

  /**
   * Add multiple leads to the database
   * @param {Array} leadsData - Array of lead objects
   * @param {String} createdBy - User ID of the person creating the leads
   * @returns {Object} - Result of the operation
   */
  static async addLeads(leadsData, createdBy) {
    try {
      // Attach CreatedBy to each lead
      const leadsWithCreator = leadsData.map((lead) => ({
        ...lead,
        CreatedBy: createdBy,
      }));

      // Validate each lead (basic validation; enhance as needed)
      const validLeads = leadsWithCreator.filter(
        (lead) => lead.Name && lead.PhoneNumber && lead.Inquiry && lead.status
      );

      if (validLeads.length === 0) {
        return {
          status: 400,
          message: "No valid leads to import.",
        };
      }

      // Insert multiple leads at once
      const insertedLeads = await Leads.insertMany(validLeads, {
        ordered: false,
      });

      // Log the successful creation of leads
      logger.info("Multiple leads successfully added", {
        count: insertedLeads.length,
        createdBy: createdBy,
      });

      return {
        status: 201,
        message: `${insertedLeads.length} leads added successfully.`,
        data: insertedLeads,
      };
    } catch (error) {
      // Log the error if the lead creation fails
      logger.error("Error adding multiple leads:", {
        message: error.message,
        stack: error.stack,
        leadsData,
        createdBy,
      });

      // Handle duplicate key errors or validation errors
      if (error.name === "BulkWriteError") {
        return {
          status: 400,
          message:
            "Some leads could not be imported due to duplication or validation errors.",
          error: error.message,
          details: error.writeErrors.map((err) => ({
            index: err.index,
            code: err.code,
            message: err.errmsg,
          })),
        };
      }

      return {
        status: 500,
        message: "Failed to import leads. Please try again later.",
        error: error.message,
      };
    }
  }

  /**
   * Fetch all leads from the database where remarketing is false or missing
   * @returns {Object} - Result of the operation
   */
  static async getAllLeads() {
    try {
      // Fetch leads where remarketing is false OR where remarketing field doesn't exist
      const leads = await Leads.find({
        $or: [{ remarketing: false }, { remarketing: { $exists: false } }],
      }).populate("CreatedBy", "username email");

      // Log the successful retrieval
      logger.info("Filtered leads fetched successfully", {
        count: leads.length,
      });

      return {
        status: 200,
        message: "Leads fetched successfully.",
        data: leads,
      };
    } catch (error) {
      // Log the error if fetching leads fails
      logger.error("Error fetching filtered leads:", {
        message: error.message,
        stack: error.stack,
      });

      return {
        status: 500,
        message: "Failed to fetch leads. Please try again later.",
        error: error.message,
      };
    }
  }

  /**
   * Update a lead by ID
   * @param {String} leadId - ID of the lead to update
   * @param {Object} updateFields - Fields to update
   * @returns {Object} - Result of the operation
   */
  static async updateLeadById(leadId, updateFields) {
    try {
      // Find and update the lead
      const updatedLead = await Leads.findByIdAndUpdate(leadId, updateFields, {
        new: true,
      });

      if (!updatedLead) {
        return { status: 404, message: "Lead not found." };
      }

      logger.info("Lead updated successfully", {
        leadId: updatedLead._id,
        updatedFields: updateFields,
      });

      return {
        status: 200,
        message: "Lead updated successfully.",
        data: updatedLead,
      };
    } catch (error) {
      logger.error("Error updating lead:", {
        message: error.message,
        stack: error.stack,
        leadId,
      });

      return {
        status: 500,
        message: "Failed to update lead. Please try again later.",
        error: error.message,
      };
    }
  }
  /**
   * Fetch all assigned leads where remarketing is false or missing
   * @param {String} userId - User's ID
   * @returns {Object} - List of assigned leads
   */
  static async getUserLeads(userId) {
    try {
      // Fetch assigned leads for the user where remarketing is false or missing
      const assignedLeads = await LeadAssignment.find({ userId })
        .populate({
          path: "leadId",
          match: {
            $or: [{ remarketing: false }, { remarketing: { $exists: false } }],
          }, // Fetch only leads where remarketing is false/missing
        })
        .populate({
          path: "userId",
          select: "username email RoleId",
        })
        .populate({
          path: "assignedBy",
          select: "username email",
        })
        .exec();

      // Remove leads that are null (if no match due to filtering)
      const filteredLeads = assignedLeads.filter(
        (lead) => lead.leadId !== null
      );

      if (!filteredLeads.length) {
        return {
          status: 404,
          message: "No assigned leads available (filtered for remarketing).",
        };
      }

      logger.info(`Filtered assigned leads fetched for user ${userId}`, {
        count: filteredLeads.length,
      });

      return {
        status: 200,
        message: "Assigned leads retrieved successfully.",
        data: filteredLeads,
      };
    } catch (error) {
      logger.error("Error fetching filtered assigned leads:", {
        message: error.message,
        stack: error.stack,
      });

      return {
        status: 500,
        message: "Failed to fetch assigned leads. Please try again later.",
        error: error.message,
      };
    }
  }

  /**
   * Add a discussion to a lead
   * @param {String} leadId - Lead ID
   * @param {String} userId - User ID of the commenter
   * @param {String} message - Message content
   */
  static async addDiscussion(leadId, userId, message) {
    try {
      if (!message || !leadId || !userId) {
        return {
          status: 400,
          message: "Lead ID, User ID, and message are required.",
        };
      }

      const newDiscussion = new LeadDiscussion({ leadId, userId, message });
      await newDiscussion.save();

      logger.info("New discussion added to lead", { leadId, userId, message });

      return {
        status: 201,
        message: "Discussion added successfully.",
        data: newDiscussion,
      };
    } catch (error) {
      logger.error("Error adding discussion:", {
        message: error.message,
        stack: error.stack,
      });

      return {
        status: 500,
        message: "Failed to add discussion.",
        error: error.message,
      };
    }
  }

  /**
   * Fetch all discussions for a lead
   * @param {String} leadId - Lead ID
   */
  static async getDiscussionsByLead(leadId) {
    try {
      const discussions = await LeadDiscussion.find({ leadId })
        .populate("userId", "username email") // Populate user details
        .sort({ createdAt: -1 }); // Sort latest first

      if (!discussions.length) {
        return { status: 404, message: "No discussions found for this lead." };
      }

      logger.info(
        `Fetched ${discussions.length} discussions for lead ${leadId}`
      );

      return {
        status: 200,
        message: "Discussions retrieved successfully.",
        data: discussions,
      };
    } catch (error) {
      logger.error("Error fetching discussions:", {
        message: error.message,
        stack: error.stack,
      });

      return {
        status: 500,
        message: "Failed to fetch discussions.",
        error: error.message,
      };
    }
  }

  /**
   * Add a new follow-up activity without replacing old ones
   * @param {Object} activityData - Activity data
   */
  static async addOrUpdateActivity(activityData) {
    try {
      const { leadId, userId, type, status, comment, followUpDate } =
        activityData;

      if (!leadId || !userId) {
        return { status: 400, message: "Lead ID and User ID are required." };
      }

      // Create a new follow-up record (DO NOT UPDATE EXISTING ONES)
      const newActivity = new LeadActivity({
        leadId,
        userId,
        type,
        status,
        comment,
        followUpDate,
      });

      await newActivity.save();

      logger.info("New follow-up added", { leadId, userId });

      return {
        status: 201,
        message: "Follow-up added successfully.",
        data: newActivity,
      };
    } catch (error) {
      logger.error("Error adding follow-up:", {
        message: error.message,
        stack: error.stack,
      });

      return {
        status: 500,
        message: "Failed to add follow-up.",
        error: error.message,
      };
    }
  }

  /**
   * Fetch all follow-ups (full history) for a lead
   * @param {String} leadId - Lead ID
   */
  static async getActivitiesByLead(leadId) {
    try {
      // Fetch all follow-up records for the given lead ID
      const activities = await LeadActivity.find({ leadId })
        .populate("userId", "username email") // Populate user details
        .sort({ createdAt: -1 }); // Sort latest first

      if (!activities.length) {
        return {
          status: 404,
          message: "No follow-up history found for this lead.",
        };
      }

      logger.info(`Fetched ${activities.length} follow-ups for lead ${leadId}`);

      return {
        status: 200,
        message: "Follow-up history retrieved successfully.",
        data: activities,
      };
    } catch (error) {
      logger.error("Error fetching follow-up history:", {
        message: error.message,
        stack: error.stack,
      });

      return {
        status: 500,
        message: "Failed to fetch follow-up history.",
        error: error.message,
      };
    }
  }

  /**
   * Toggle remarketing status for a lead
   * @param {String} leadId - Lead ID
   * @returns {Object} - Updated lead response
   */
  static async toggleRemarketing(leadId) {
    try {
      // Find the lead
      const lead = await Leads.findById(leadId);

      if (!lead) {
        return { status: 404, message: "Lead not found." };
      }

      // Toggle remarketing status
      lead.remarketing = !lead.remarketing;
      await lead.save();

      logger.info(
        `Remarketing toggled for lead ${leadId} to ${lead.remarketing}`
      );

      return {
        status: 200,
        message: `Remarketing updated to ${lead.remarketing}`,
        data: { leadId, remarketing: lead.remarketing },
      };
    } catch (error) {
      logger.error("Error toggling remarketing:", {
        message: error.message,
        stack: error.stack,
        leadId,
      });

      return {
        status: 500,
        message: "Failed to update remarketing status.",
        error: error.message,
      };
    }
  }

  /**
   * Fetch remarketing leads based on user role
   * @param {String} userId - User ID from the token
   * @param {String} userType - User type (SuperAdmin or Other)
   * @returns {Object} - List of remarketing leads
   */
  static async getRemarketingLeads(userId, userType) {
    try {
      let leads = [];

      if (userType === "superadmin") {
        // Fetch all leads where remarketing is true
        leads = await Leads.find({ remarketing: true }).populate(
          "CreatedBy",
          "username email"
        );

        logger.info(`SuperAdmin fetched all remarketing leads`, {
          count: leads.length,
        });
      } else {
        // Fetch only assigned leads with remarketing enabled
        const assignedLeads = await LeadAssignment.find({ userId })
          .populate({
            path: "leadId",
            match: { remarketing: true }, // Filter only remarketing leads
          })
          .populate({
            path: "userId",
            select: "username email RoleId",
          })
          .populate({
            path: "assignedBy",
            select: "username email",
          })
          .exec();

        // Remove leads that are null (if no match due to filtering)
        leads = assignedLeads.filter((lead) => lead.leadId !== null);

        logger.info(`User ${userId} fetched assigned remarketing leads`, {
          count: leads.length,
        });
      }

      if (!leads.length) {
        return { status: 404, message: "No remarketing leads found." };
      }

      return {
        status: 200,
        message: "Remarketing leads retrieved successfully.",
        data: leads,
      };
    } catch (error) {
      logger.error("Error fetching remarketing leads:", {
        message: error.message,
        stack: error.stack,
      });

      return {
        status: 500,
        message: "Failed to fetch remarketing leads. Please try again later.",
        error: error.message,
      };
    }
  }
  /**
   * Update the qualified status of a lead
   * @param {String} leadId - Lead ID
   * @param {String} qualifiedStatus - New qualified status (qualified/unqualified)
   * @returns {Object} - Response object with status and message
   */
  static async updateQualifiedStatus(leadId, qualifiedStatus) {
    try {
      // Find and update the lead's qualifiedStatus
      const updatedLead = await Leads.findByIdAndUpdate(
        leadId,
        { qualifiedStatus: qualifiedStatus.toLowerCase() },
        { new: true }
      );

      if (!updatedLead) {
        return { status: 404, message: "Lead not found." };
      }

      logger.info("Lead qualified status updated successfully", {
        leadId: updatedLead._id,
        newStatus: qualifiedStatus,
      });

      return {
        status: 200,
        message: "Lead qualified status updated successfully.",
        data: updatedLead,
      };
    } catch (error) {
      logger.error("Error updating lead qualified status:", {
        message: error.message,
        stack: error.stack,
        leadId,
      });

      return {
        status: 500,
        message:
          "Failed to update lead qualified status. Please try again later.",
        error: error.message,
      };
    }
  }

  /**
   * Fetch lead counts based on user type
   * @param {String} userId - User ID from JWT token
   * @param {String} userType - User type (superadmin or other roles)
   * @returns {Object} - Lead counts
   */
  static async getLeadCounts(userId, userType) {
    try {
      let totalLeads, remarketingLeads, qualifiedLeads, unqualifiedLeads;

      if (userType === "superadmin") {
        // Fetch counts for all leads (for superadmin)
        totalLeads = await Leads.countDocuments();
        remarketingLeads = await Leads.countDocuments({ remarketing: true });
        qualifiedLeads = await Leads.countDocuments({
          qualifiedStatus: "qualified",
        });
        unqualifiedLeads = await Leads.countDocuments({
          qualifiedStatus: "unqualified",
        });
      } else {
        // Fetch counts only for leads assigned to the user
        const assignedLeads = await LeadAssignment.find({ userId }).select(
          "leadId"
        );
        const assignedLeadIds = assignedLeads.map((l) => l.leadId);

        totalLeads = await Leads.countDocuments({
          _id: { $in: assignedLeadIds },
        });
        remarketingLeads = await Leads.countDocuments({
          _id: { $in: assignedLeadIds },
          remarketing: true,
        });
        qualifiedLeads = await Leads.countDocuments({
          _id: { $in: assignedLeadIds },
          qualifiedStatus: "qualified",
        });
        unqualifiedLeads = await Leads.countDocuments({
          _id: { $in: assignedLeadIds },
          qualifiedStatus: "unqualified",
        });
      }

      logger.info(`Lead counts fetched successfully for user ${userId}`);

      return {
        status: 200,
        message: "Lead counts retrieved successfully.",
        data: {
          totalLeads,
          remarketingLeads,
          qualifiedLeads,
          unqualifiedLeads,
        },
      };
    } catch (error) {
      logger.error("Error fetching lead counts:", {
        message: error.message,
        stack: error.stack,
        userId,
      });

      return {
        status: 500,
        message: "Failed to fetch lead counts. Please try again later.",
        error: error.message,
      };
    }
  }

  /**
   * Fetch all follow-ups created by a specific user
   * @param {String} userId - Authenticated user ID from token
   */
  static async getUserFollowUps(userId) {
    try {
      if (!userId) {
        return { status: 400, message: "User ID is required." };
      }

      // Fetch all follow-ups created by this user
      const activities = await LeadActivity.find({ userId })
        .populate("leadId", "Name") // Populate lead details
        .sort({ createdAt: -1 }); // Sort by latest first

      if (!activities.length) {
        return {
          status: 404,
          message: "No follow-up history found for this user.",
        };
      }

      logger.info(`User ${userId} fetched ${activities.length} follow-ups`);

      return {
        status: 200,
        message: "User follow-up history retrieved successfully.",
        data: activities,
      };
    } catch (error) {
      logger.error("Error fetching user follow-ups:", {
        message: error.message,
        stack: error.stack,
      });

      return {
        status: 500,
        message: "Failed to fetch user follow-ups.",
        error: error.message,
      };
    }
  }

  /**
   * Fetch leads based on filter criteria with role-based access
   * @param {Object} filters - Query parameters from request
   * @param {String} userId - Authenticated user's ID
   * @param {String} userRole - User's role (SuperAdmin, Admin, etc.)
   */
  static async getFilteredLeads(filters, userId, userRole) {
    try {
      let query = {};

      // Apply date range filter
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }

      // Apply name or phone number search
      if (filters.namePhone) {
        query.$or = [
          { Name: { $regex: filters.namePhone, $options: "i" } },
          { PhoneNumber: { $regex: filters.namePhone, $options: "i" } },
        ];
      }

      // Apply status filter
      if (filters.status) {
        query.status = filters.status;
      }

      // Apply qualified status filter
      if (filters.qualifiedStatus) {
        query.qualifiedStatus = filters.qualifiedStatus.toLowerCase();
      }

      // Apply advisor filter
      if (filters.advisor) {
        query.Advisor = filters.advisor;
      }

      // Apply source filter
      if (filters.source) {
        query.Source = filters.source;
      }

      // **Role-Based Access:**
      if (userRole !== "superadmin") {
        if (userRole === "admin") {
          // Admins can see all leads, no additional restriction
        } else {
          // Other users can only see assigned leads
          const assignedLeads = await LeadAssignment.find({ userId }).select(
            "leadId"
          );
          const assignedLeadIds = assignedLeads.map((l) => l.leadId);
          query._id = { $in: assignedLeadIds };
        }
      }

      // Execute the query with filters
      const leads = await Leads.find(query).populate(
        "CreatedBy",
        "username email"
      );

      if (!leads.length) {
        return {
          status: 404,
          message: "No leads found with the given filters.",
        };
      }

      logger.info(`User ${userId} fetched ${leads.length} filtered leads`);

      return {
        status: 200,
        message: "Filtered leads retrieved successfully.",
        data: leads,
      };
    } catch (error) {
      logger.error("Error fetching filtered leads:", {
        message: error.message,
        stack: error.stack,
      });

      return {
        status: 500,
        message: "Failed to fetch leads. Please try again later.",
        error: error.message,
      };
    }
  }
}

module.exports = LeadsService;
