const User = require('../models/User.model');
const { language } = require('../language/language');
const { createToken, verifyToken } = require('../modules/helper');
const { httpsCodes } = require('../modules/constants');
const UserService = require('../services/UserService')
const bcrypt = require('bcrypt');
const logger = require('../modules/logger');
const ForgotPassword = require('./ForgotPassword');
const RoleService = require('../services/RoleService');

'use-strict';

class AdminService {

/**
 * Get all users (Only for SuperAdmin)
 * @returns {Object} - List of users with password status ✅ ❌ and role name
 */
static async getAllUsers() {
    try {
        // Fetch users and populate the RoleId field to get role names
        const users = await User.find()
            .select('username email gender phonenumber Address RoleId password')
            .populate('RoleId', 'name'); // Populate RoleId to get role name

        if (!users.length) {
            return { status: 404, message: 'No users found.' };
        }

        // Format response to show ✅ or ❌ for password status and role name
        const formattedUsers = users.map(user => ({
            _id: user._id,
            username: user.username,
            email: user.email,
            gender: user.gender,
            phonenumber: user.phonenumber || 'N/A',
            address: user.Address,
            role: user.RoleId ? user.RoleId.name : 'N/A', // Show role name instead of ID
            passwordStatus: user.password ? '✅' : '❌' // ✅ if password exists, ❌ if null/undefined
        }));

        logger.info('Fetched all users successfully for SuperAdmin');

        return {
            status: 200,
            message: 'Users retrieved successfully.',
            data: formattedUsers
        };
    } catch (error) {
        logger.error('Error in AdminService - Get All Users:', {
            message: error.message,
            stack: error.stack
        });

        return {
            status: 500,
            message: 'Failed to fetch users. Please try again later.',
            error: error.message
        };
    }
}


    static async addVendor(reqObj) {
        try {
            const { username, email, roleId , gender, phonenumber, Address, createdBy } = reqObj;

            // Validate required fields
            if (!username || !email  || !gender || !Address) {
                return { status: 400, message: 'All fields are required.' };
            }

            // Fetch all roles and find the 'Vendor' role
            const rolesResponse = await RoleService.getAllRoles();
            if (rolesResponse.status !== 200) {
                throw new Error('Failed to fetch roles.');
            }


            // Check if the email already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return { status: 409, message: 'User with this email already exists.' };
            }

            // // Hash the password
            // const hashedPassword = await bcrypt.hash(password, 10);

            // Create the Vendor user
            const newVendor = new User({
                username,
                email,
                gender,
                phonenumber,
                Address,
                RoleId: roleId,
                createdBy : createdBy // Link to the SuperAdmin who created the Vendor
            });

            // Save the new vendor
            const savedVendor = await newVendor.save();

            return { 
                status: 201, 
                message: 'Vendor successfully created.', 
                result: savedVendor 
            };
        } catch (error) {
            logger.error('Error in AdminService - Add Vendor:', {
                message: error.message,
                stack: error.stack,
                data: reqObj
            });
            throw error;
        }
    }

}

module.exports = AdminService;