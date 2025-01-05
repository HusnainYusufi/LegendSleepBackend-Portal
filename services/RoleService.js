const Role = require('../models/Role.model');
const logger = require('../modules/logger'); // Import the logger

class RoleService {
    static async addRole(data) {
        try {
            const { name } = data;

            if (!name) {
                return { status: 400, message: 'Role Name is required' };
            }

            const role = new Role({ name });
            const savedRole = await role.save();

            return { status: 201, message: 'Role added successfully', data: savedRole };
        } catch (error) {
            logger.error('Error in RoleService - Add Role:', {
                message: error.message,
                stack: error.stack,
                data
            });
            throw error;
        }
    }



    static async getAllRoles() {
        try {
            const roles = await Role.find({}).exec();

            return { status: 200, message: 'Roles fetched successfully', data: roles };
        } catch (error) {
            logger.error('Error in RoleService - Get All Roles:', {
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = RoleService;
