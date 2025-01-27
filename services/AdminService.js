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

    //get all users
    static async getAllUsers() {
        try {
            let result = "";

            // Fetch all roles
            let rolesResponse = await RoleService.getAllRoles();

            // Check if roles were fetched successfully
            if (rolesResponse.status !== 200) {
                throw new Error('Failed to fetch roles');
            }

            let vendorRole = rolesResponse.data.find(role => role.name === 'Vendor');

            if (!vendorRole) {
                throw new Error('Vendor role not found');
            }
            let vendorRoleId = vendorRole._id;
            const users = await User.find({ RoleId: vendorRoleId }).populate('RoleId').exec();

            return {
                status: 200,
                message: 'Users fetched successfully',
                result: users
            };
        } catch (error) {
            logger.error('Error in AdminService - Get All Users:', {
                message: error.message,
                stack: error.stack
            });
            throw error;
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