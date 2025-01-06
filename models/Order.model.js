const mongoose = require('mongoose');

try {
    'use strict';

    const OrderSchema = new mongoose.Schema({
        countryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Country',
            required: true
        },
        VisaTypeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VisaType',
            required: true
        },
        ClientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        SalesPersonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        InitialPayment : {
            type : Number,
            required : true
        },
        FinalPayment : {
            type : Number,
            required : true
        },
        status: {
            type: String,
            enum: ['Open', 'Closed', 'Rejected', 'Refunded', 'Completed'],
            default: 'Open' 
        },
        createdAt : {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    });

    OrderSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    })

    const Order = mongoose.model('Order', OrderSchema);

    module.exports = Order;

} catch (error) {
    console.error('Error creating the Order schema:', error);
}
