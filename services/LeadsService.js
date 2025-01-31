const Leads = require('../models/Leads.model'); // Import the Leads model
const logger = require('../modules/logger'); // Import the logger
const LeadAssignment = require('../models/LeadAssignment.model');
const LeadDiscussion = require('../models/LeadDiscussion.model');
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
            logger.info('Lead successfully added', {
                leadId: savedLead._id,
                createdBy: createdBy,
                name: leadData.Name
            });

            return {
                status: 201,
                message: 'Lead added successfully.',
                data: savedLead
            };
        } catch (error) {
            // Log the error if the lead creation fails
            logger.error('Error adding lead:', {
                message: error.message,
                stack: error.stack,
                leadData,
                createdBy
            });

            return {
                status: 500,
                message: 'Failed to add lead. Please try again later.',
                error: error.message
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
            const leadsWithCreator = leadsData.map(lead => ({
                ...lead,
                CreatedBy: createdBy
            }));

            // Validate each lead (basic validation; enhance as needed)
            const validLeads = leadsWithCreator.filter(lead => 
                lead.Name && 
                lead.PhoneNumber && 
                lead.Inquiry && 
                lead.status
            );

            if (validLeads.length === 0) {
                return {
                    status: 400,
                    message: 'No valid leads to import.',
                };
            }

            // Insert multiple leads at once
            const insertedLeads = await Leads.insertMany(validLeads, { ordered: false });

            // Log the successful creation of leads
            logger.info('Multiple leads successfully added', {
                count: insertedLeads.length,
                createdBy: createdBy
            });

            return {
                status: 201,
                message: `${insertedLeads.length} leads added successfully.`,
                data: insertedLeads
            };
        } catch (error) {
            // Log the error if the lead creation fails
            logger.error('Error adding multiple leads:', {
                message: error.message,
                stack: error.stack,
                leadsData,
                createdBy
            });

            // Handle duplicate key errors or validation errors
            if (error.name === 'BulkWriteError') {
                return {
                    status: 400,
                    message: 'Some leads could not be imported due to duplication or validation errors.',
                    error: error.message,
                    details: error.writeErrors.map(err => ({
                        index: err.index,
                        code: err.code,
                        message: err.errmsg
                    }))
                };
            }

            return {
                status: 500,
                message: 'Failed to import leads. Please try again later.',
                error: error.message
            };
        }
    }

     /**
     * Fetch all leads from the database
     * @returns {Object} - Result of the operation
     */
     static async getAllLeads() {
        try {
            // Fetch all leads, populate CreatedBy field if necessary
            const leads = await Leads.find().populate('CreatedBy', 'username email'); // Adjust fields as needed

            // Log the successful retrieval
            logger.info('All leads fetched successfully', {
                count: leads.length
            });

            return {
                status: 200,
                message: 'Leads fetched successfully.',
                data: leads
            };
        } catch (error) {
            // Log the error if fetching leads fails
            logger.error('Error fetching all leads:', {
                message: error.message,
                stack: error.stack
            });

            return {
                status: 500,
                message: 'Failed to fetch leads. Please try again later.',
                error: error.message
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
            const updatedLead = await Leads.findByIdAndUpdate(leadId, updateFields, { new: true });

            if (!updatedLead) {
                return { status: 404, message: 'Lead not found.' };
            }

            logger.info('Lead updated successfully', {
                leadId: updatedLead._id,
                updatedFields: updateFields
            });

            return {
                status: 200,
                message: 'Lead updated successfully.',
                data: updatedLead
            };
        } catch (error) {
            logger.error('Error updating lead:', {
                message: error.message,
                stack: error.stack,
                leadId
            });

            return {
                status: 500,
                message: 'Failed to update lead. Please try again later.',
                error: error.message
            };
        }
    }

     /**
     * Fetch all leads assigned to a user
     * @param {String} userId - User's ID
     * @returns {Object} - List of assigned leads
     */
     static async getUserLeads(userId) {
        try {
            // Fetch assigned leads for the user with full details
            const assignedLeads = await LeadAssignment.find({ userId })
                .populate({
                    path: 'leadId', // Populate ALL lead details
                })
                .populate({
                    path: 'userId', // Populate assigned user's details
                    select: 'username email RoleId' // Fetching only necessary fields
                })
                .populate({
                    path: 'assignedBy', // Populate details of admin/CRO who assigned the lead
                    select: 'username email'
                })
                .exec();

            if (!assignedLeads.length) {
                return { status: 404, message: 'No leads assigned to this user.' };
            }

            logger.info(`Fetched ${assignedLeads.length} assigned leads for user ${userId}`);

            return {
                status: 200,
                message: 'Assigned leads retrieved successfully.',
                data: assignedLeads
            };
        } catch (error) {
            logger.error('Error fetching user-specific leads:', {
                message: error.message,
                stack: error.stack
            });

            return {
                status: 500,
                message: 'Failed to fetch assigned leads.',
                error: error.message
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
                return { status: 400, message: 'Lead ID, User ID, and message are required.' };
            }

            const newDiscussion = new LeadDiscussion({ leadId, userId, message });
            await newDiscussion.save();

            logger.info('New discussion added to lead', { leadId, userId, message });

            return { status: 201, message: 'Discussion added successfully.', data: newDiscussion };
        } catch (error) {
            logger.error('Error adding discussion:', { message: error.message, stack: error.stack });

            return { status: 500, message: 'Failed to add discussion.', error: error.message };
        }
    }

    /**
     * Fetch all discussions for a lead
     * @param {String} leadId - Lead ID
     */
    static async getDiscussionsByLead(leadId) {
        try {
            const discussions = await LeadDiscussion.find({ leadId })
                .populate('userId', 'username email') // Populate user details
                .sort({ createdAt: -1 }); // Sort latest first

            if (!discussions.length) {
                return { status: 404, message: 'No discussions found for this lead.' };
            }

            logger.info(`Fetched ${discussions.length} discussions for lead ${leadId}`);

            return { status: 200, message: 'Discussions retrieved successfully.', data: discussions };
        } catch (error) {
            logger.error('Error fetching discussions:', { message: error.message, stack: error.stack });

            return { status: 500, message: 'Failed to fetch discussions.', error: error.message };
        }
    }
}

module.exports = LeadsService;