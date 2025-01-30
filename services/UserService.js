const User = require('../models/User.model');
const bcrypt = require('bcrypt');
const logger = require('../modules/logger');
const Role = require('../models/Role.model');

'use-strict';

class UserService {

    /**
     * Set User Password
     * @param {Object} reqObj - Request object containing email and new password.
     * @returns {Object} - Status and message/result.
     */
    static async setUserPassword(reqObj) {
        try {
            const { email, password } = reqObj;

            // Validate required fields
            if (!email || !password) {
                return { status: 400, message: 'Email and password are required.' };
            }

            // Find the user by email
            const user = await User.findOne({ email });
            if (!user) {
                return { status: 404, message: 'User not found.' };
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Update the user's password
            user.password = hashedPassword;
            await user.save();

            return {
                status: 200,
                message: 'Password updated successfully.',
                result: { email: user.email, username: user.username }
            };
        } catch (error) {
            logger.error('Error in UserService - Set User Password:', {
                message: error.message,
                stack: error.stack,
                data: reqObj
            });
            throw error;
        }
    }

    static async verifyUser(reqObj) {
        try {
            let filters = {}; // Initialize as an object, not an array
    
            if (reqObj?.email) {
                filters.email = reqObj.email;
            }
    
            if (reqObj?.userId) {
                filters._id = reqObj.userId;
            }
    
            // Use the filters object for querying
            const user = await User.findOne(filters).populate('RoleId').exec();
    
            if (!user) {
                return { status: 400, message: "Not Found" };
            }
    
            return { status: 200 , message: "Record Found", result: user };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Fetch all users with a specific role
     * @param {String} roleName - Role name (e.g., "CRO")
     * @returns {Object} - JSON response with user data
     */
    static async getUsersByRole(roleName) {
        try {
            // Find the role ID for "CRO"
            const role = await Role.findOne({ name: roleName });

            if (!role) {
                return { status: 404, message: `Role "${roleName}" not found.` };
            }

            // Find users with this role ID
            const users = await User.find({ RoleId: role._id }).select('-password').populate('RoleId', 'name');

            if (!users.length) {
                return { status: 404, message: `No users found with role "${roleName}".` };
            }

            logger.info(`Fetched ${users.length} users with role "${roleName}".`);

            return {
                status: 200,
                message: `Users with role "${roleName}" fetched successfully.`,
                data: users
            };
        } catch (error) {
            logger.error('Error fetching users by role:', {
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
}

module.exports = UserService;