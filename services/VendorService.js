const bcrypt = require('bcrypt');
const RoleService = require('../services/RoleService');
const User = require('../models/User.model');
const Order = require('../models/Order.model');
const logger = require('../modules/logger');

class VendorService {
    static async onboardClientAndOrder(reqObj) {
        try {
            const { username, email, password, gender, phonenumber, Address, createdBy, countryId, VisaTypeId, InitialPayment, FinalPayment } = reqObj;

            // Validate required fields
            if (!username || !email || !password || !gender || !Address || !countryId || !VisaTypeId || !InitialPayment || !FinalPayment) {
                return { status: 400, message: 'All fields are required.' };
            }

            // Fetch all roles and find the 'Client' role
            const rolesResponse = await RoleService.getAllRoles();
            if (rolesResponse.status !== 200) {
                throw new Error('Failed to fetch roles.');
            }

            const clientRole = rolesResponse.data.find(role => role.name === 'Client');
            if (!clientRole) {
                throw new Error('Client role not found.');
            }

            // Check if the email already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return { status: 409, message: 'User with this email already exists.' };
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create the Client user
            const newClient = new User({
                username,
                email,
                password: hashedPassword,
                gender,
                phonenumber,
                Address,
                RoleId: clientRole._id, // Assign Client role
                createdBy // Link to the Vendor who created this client
            });

            const savedClient = await newClient.save();

            // Create the Order linked to the Client
            const newOrder = new Order({
                countryId,
                VisaTypeId,
                ClientId: savedClient._id, // Link to the newly created client
                SalesPersonId: createdBy, // Link to the Vendor
                InitialPayment,
                FinalPayment
            });

            const savedOrder = await newOrder.save();

            return {
                status: 201,
                message: 'Client and order successfully created.',
                result: { client: savedClient, order: savedOrder }
            };
        } catch (error) {
            logger.error('Error in VendorService - Onboard Client and Order:', {
                message: error.message,
                stack: error.stack,
                data: reqObj
            });
            throw error;
        }
    }
}

module.exports = VendorService;
