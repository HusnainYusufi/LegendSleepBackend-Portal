const Leads = require('../models/Leads.model'); // Import the Leads model
const logger = require('../modules/logger'); // Import the logger

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
}

module.exports = LeadsService;