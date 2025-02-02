const mongoose = require('mongoose');

try {
    'use strict';

    const LeadsSchema = new mongoose.Schema({
        Name: {
            type: String
        },
        PhoneNumber: {
            type: String
        },
        Email: {
            type: String
        },
        Address: {
            type: String
        },
        Inquiry: {
            type: String
        },
        InquiryCountry: {
            type: String
        },
        Budget: {
            type: String
        },
        Detail: {
            type: String
        },
        Occupation: {
            type: String
        },
        Service: {
            type: String
        },
        Source: {
            type: String
        },
        CreatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        Advisor: {
            type: String
        },
        qualifiedStatus: {
            type: String,
            default: "unqualified"
        },
        status: {
            type: String,
            enum: ['Assigned', 'Closed', 'Rejected', 'Pending', 'Completed' , 'Remarketing']
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

    LeadsSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    });

    const Leads = mongoose.model('Leads', LeadsSchema);

    module.exports = Leads;

} catch (error) {
    console.error('Error creating the Leads schema:', error);
}
