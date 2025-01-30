const LeadAssignment = require('../models/LeadAssignment.model');
const Leads = require('../models/Leads.model');
const User = require('../models/User.model');
const logger = require('../modules/logger');

class LeadAssignmentService {
    /**
     * Assign a lead to a user and update its status
     * @param {String} leadId - Lead to be assigned
     * @param {String} userId - User to whom the lead is assigned
     * @param {String} assignedBy - Admin who assigned the lead
     * @param {String} remarks - Additional comments (optional)
     * @returns {Object} - Response containing assignment details
     */
    static async assignLead(leadId, userId, assignedBy, remarks = '') {
        try {
            // Ensure the lead exists
            const lead = await Leads.findById(leadId);
            console.log('inside leadassingment service' , lead);
    
            if (!lead) {
                return { status: 404, message: 'Lead not found.' };
            }

            // Ensure the user exists
            const user = await User.findById(userId);
            if (!user) {
                return { status: 404, message: 'User not found.' };
            }
            // Check if the lead is already assigned
            if (lead.status === 'Assigned') {
                return { status: 303, message: 'This lead is already assigned to a user.' };
            }

            // Assign the lead
            const newAssignment = new LeadAssignment({ leadId, userId, assignedBy, remarks });
            await newAssignment.save();

            // Update lead status to "Assigned"
            lead.status = 'Assigned';
            await lead.save();

            logger.info('Lead assigned successfully and status updated.', { leadId, userId, assignedBy });

            return {
                status: 201,
                message: 'Lead assigned successfully and status updated to "Assigned".',
                data: {
                    assignment: newAssignment,
                    updatedLead: lead
                }
            };
        } catch (error) {
            logger.error('Error assigning lead:', { message: error.message, stack: error.stack });

            return {
                status: 500,
                message: 'Failed to assign lead.',
                error: error.message
            };
        }
    }
}

module.exports = LeadAssignmentService;
