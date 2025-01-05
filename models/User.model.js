const mongoose = require('mongoose');

try {
    'use strict';

    const UserSchema = new mongoose.Schema({
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other', 'Male', 'Female', 'MALE', 'FEMALE'],
            required: true
        },
        phonenumber: {
            type: String,
            required: false
        },
        Address: {
            type: String,
            required: true
        },
        RoleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            required: true
        },

        createdAt: {
            type: Date,
            default: Date.now
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false // Optional for clients/vendors
        },        
        updatedAt: {
            type: Date,
            default: Date.now
        }
    });

    UserSchema.pre('save', function (next) {
        this.updatedAt = Date.now();
        next();
    })

    const User = mongoose.model('User', UserSchema);

    module.exports = User;

} catch (error) {
    console.error('Error creating the User schema:', error);
}
