const User = require('../models/User.model');
const bcrypt = require('bcrypt');
const logger = require('../modules/logger');

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
}

module.exports = UserService;