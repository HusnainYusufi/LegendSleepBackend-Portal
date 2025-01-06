const express = require('express');
const router = express.Router();
const AdminService = require('../services/AdminService');
const UserService = require('../services/UserService');
const { verifyToken } = require('../modules/helper');
const logger = require('../modules/logger'); // Import logger

// Route to get all users
router.get('/all/users', async (req, res, next) => {
    try {
        let token = req.headers['authorization']?.split(' ')[1];

        const verifiedToken = await verifyToken(token);

        if (verifiedToken?.data?.userType === 'SuperAdmin') {
            const response = await AdminService.getAllUsers({ token });
            res.json(response);
        } else {
            logger.error('Unauthorized access attempt in AdminController - /all/users:', {
                message: "Unauthorized access",
                userType: verifiedToken?.data?.userType || 'Unknown',
                userId: verifiedToken?.data?.userId || 'Unknown',
                email: verifiedToken?.data?.email || 'Unknown',
                ipAddress: req.ip || req.connection.remoteAddress,
                headers: req.headers
            });
            return res.status(403).json({ message: 'Access denied. Only SuperAdmin can access this resource.' });
        }
    } catch (error) {
        logger.error('Error in AdminController - /all/users:', {
            message: error.message,
            stack: error.stack,
            headers: req.headers,
            body: req.body,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error);
    }
});


router.post('/give/access', async (req, res, next) => {
    try {
        // Extract the token from the Authorization header
        let token = req.headers['authorization']?.split(' ')[1];

        // Verify the token
        const verifiedToken = await verifyToken(token);

        // Check if the user is SuperAdmin
        if (verifiedToken?.data?.userType === 'SuperAdmin') {
            const response = await AdminService.addVendor({ 
                createdBy: verifiedToken.data.user, 
                ...req.body 
            });
            res.json(response);
        } else {
            logger.error('Unauthorized access attempt in AdminController - /give/access:', {
                message: "Unauthorized access",
                role: verifiedToken?.data?.role || 'Unknown',
                userId: verifiedToken?.data?.userId || 'Unknown',
                email: verifiedToken?.data?.email || 'Unknown',
                ipAddress: req.ip || req.connection.remoteAddress,
                headers: req.headers
            });
            return res.status(403).json({ message: 'Access denied. Only SuperAdmin can access this resource.' });
        }
    } catch (error) {
        logger.error('Error in AdminController - /give/access:', {
            message: error.message,
            stack: error.stack,
            headers: req.headers,
            body: req.body,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error);
    }
});

module.exports = router;
