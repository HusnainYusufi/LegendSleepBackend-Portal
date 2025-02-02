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
 * Fetch users based on role restrictions
 * @param {String|null} excludeRole - Role to exclude (e.g., "superadmin") or null for all users
 * @param {String} requestingUserId - The userId of the requester (to exclude)
 * @returns {Object} - JSON response with user data
 */
static async getAllUsersExceptRole(excludeRole, requestingUserId) {
    try {
        let query = { _id: { $ne: requestingUserId } }; // Exclude the requester

        if (excludeRole) {
            // Find the role ID for "SuperAdmin" to exclude
            const excludedRole = await Role.findOne({ name: excludeRole });

            if (excludedRole) {
                query.RoleId = { $ne: excludedRole._id }; // Exclude users with this RoleId
            }
        }

        // Find users with the query
        const users = await User.find(query).select('-password').populate('RoleId', 'name');

        if (!users.length) {
            return { status: 404, message: `No users found.` };
        }

        logger.info(`Fetched ${users.length} users, excluding role: ${excludeRole || 'None'}, and excluding requester: ${requestingUserId}`);

        return {
            status: 200,
            message: `Users fetched successfully.`,
            data: users
        };
    } catch (error) {
        logger.error('Error fetching users:', {
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