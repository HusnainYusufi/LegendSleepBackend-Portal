const express = require('express');
const router = express.Router();
const AuthService = require('../services/AuthService'); // Import AuthService
const RoleService = require('../services/RoleService'); // Import RoleService
const logger = require('../modules/logger'); // Import logger


router.post('/signup-superadmin', async (req, res, next) => {
    try {
       
        const roleResponse = await RoleService.getAllRoles();
        if (roleResponse.status !== 200) {
            return res.status(roleResponse.status).json(roleResponse);
        }

        // Find the SuperAdmin role
        const superAdminRole = roleResponse.data.find(role => role.name.toLowerCase() === 'superadmin');
        if (!superAdminRole) {
            return res.status(404).json({ message: 'SuperAdmin role not found. Please create it first.' });
        }

       
        const result = await AuthService.signupSuperAdmin(req.body, superAdminRole._id);
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in AuthController - SuperAdmin Signup:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
});

// Login Route
router.post('/login', async (req, res, next) => {
    try {
        
        const result = await AuthService.login({ ...req.body });
        console.log('result resoinse' , result);
        return res.json(result);
    } catch (error) {
        logger.error('Error in AuthController - Login:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
});

module.exports = router;
