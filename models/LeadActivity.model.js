const mongoose = require('mongoose');

const LeadActivitySchema = new mongoose.Schema({
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Leads', // Reference to the lead
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // User who performed the activity
        required: true
    },
    type: {
        type: String,
        enum: ['Discussion', 'Follow-up', 'Status Update' , 'Email' , 'Marketing' , 'Call'], // Different activity types
        default: null
    },
    status: {
        type: String,
        enum: ['Assigned', 'Pending', 'Completed', 'Rejected' , 'Open' , 'In Progress' , 'Closed'],
        default: null
    },
    comment: {
        type: String, // Comment for discussion or follow-up
        default: ''
    },
    followUpDate: {
        type: Date, // Optional follow-up date
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Automatically update `updatedAt` field on update
LeadActivitySchema.pre('findOneAndUpdate', function (next) {
    this.set({ updatedAt: Date.now() });
    next();
});

const LeadActivity = mongoose.model('LeadActivity', LeadActivitySchema);
module.exports = LeadActivity;
