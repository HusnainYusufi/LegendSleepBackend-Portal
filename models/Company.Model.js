const mongoose = require('mongoose');

try {
    'use strict';

    const CompanySchema = new mongoose.Schema({
        name: {
            type: String,
            required: true,
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

    CompanySchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    })

    const Company = mongoose.model('Company', CompanySchema);

    module.exports = Company;

} catch (error) {
    console.error('Error creating the User schema:', error);
}