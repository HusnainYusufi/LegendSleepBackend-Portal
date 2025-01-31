const mongoose = require('mongoose');

const LeadDiscussionSchema = new mongoose.Schema({
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Leads', // Reference to the lead
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // User who posted the discussion
        required: true
    },
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const LeadDiscussion = mongoose.model('LeadDiscussion', LeadDiscussionSchema);
module.exports = LeadDiscussion;
