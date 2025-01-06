const mongoose = require('mongoose');

try {
    'use strict';

    const VisaTypeSchema = new mongoose.Schema({
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 1,
            maxlength: 30
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

    VisaTypeSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    })

    const VisaType = mongoose.model('VisaType', VisaTypeSchema);

    module.exports = VisaType;

} catch (error) {
    console.error('Error creating the VisaType schema:', error);
}
