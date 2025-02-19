const mongoose = require('mongoose');

try {
    'use strict';

    const DriverSchema = new mongoose.Schema({
        name: {
            type: String,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30
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

    DriverSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    })

    const Driver = mongoose.model('Driver', DriverSchema);

    module.exports = Driver;

} catch (error) {
    console.error('Error creating the User schema:', error);
}