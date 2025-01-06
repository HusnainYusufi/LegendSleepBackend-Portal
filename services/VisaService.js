const VisaType = require('../models/VisaType.model');
const logger = require('../modules/logger'); 

class VisaTypeService {
    // Service to add a new visa type
    static async addVisaType(data) {
        try {
            const { name } = data;

            if (!name) {
                return { status: 400, message: 'Visa Type Name is required' };
            }

            // Check if visa type already exists
            const existingVisaType = await VisaType.findOne({ name: name.trim() });
            if (existingVisaType) {
                return { status: 409, message: 'Visa Type already exists' };
            }

            // Create and save the new visa type
            const visaType = new VisaType({ name: name.trim() });
            const savedVisaType = await visaType.save();

            return { status: 201, message: 'Visa Type added successfully', data: savedVisaType };
        } catch (error) {
            logger.error('Error in VisaTypeService - Add VisaType:', {
                message: error.message,
                stack: error.stack,
                data
            });
            throw error;
        }
    }

    // Service to get all visa types
    static async getAllVisaTypes() {
        try {
            const visaTypes = await VisaType.find({}).exec();

            return { status: 200, message: 'Visa Types fetched successfully', data: visaTypes };
        } catch (error) {
            logger.error('Error in VisaTypeService - Get All VisaTypes:', {
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = VisaTypeService;
