const mongoose = require('mongoose');

const LeadAssignmentSchema = new mongoose.Schema({
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Leads', // Reference to the Leads model
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // The admin or CRO who assigned the lead
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },
    remarks: {
        type: String, // Optional remarks for the assignment
        default: ''
    }
});

const LeadAssignment = mongoose.model('LeadAssignment', LeadAssignmentSchema);
module.exports = LeadAssignment;
