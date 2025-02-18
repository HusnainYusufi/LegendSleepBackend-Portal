const express = require('express');
const router = express.Router();
const LeadsService = require('../services/LeadsService'); // Import LeadsService
const { verifyToken } = require('../modules/helper'); // Import verifyToken for role extraction
const logger = require('../modules/logger'); // Import logger
const leadUpload = require('../services/leadUpload');// Import the leads multer middleware
const XLSX = require('xlsx'); // Import xlsx for Excel parsing
const fs = require('fs');
const path = require('path');
const Notification = require('../models/Notification.model');

// Route to add a lead
router.post('/add', async (req, res, next) => {
    try {

        // Extract the token from the Authorization header
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        // Verify the token and extract the user's role
        const verifiedToken = await verifyToken(token);
      
        // Check if the user has the required role (SuperAdmin or CRO)
        const allowedRoles = ['superadmin', 'cro'];
        if (!allowedRoles.includes(verifiedToken?.data?.userType?.toLowerCase())) {
            logger.error('Unauthorized access attempt in LeadsController - /add:', {
                message: "Unauthorized access",
                role: verifiedToken?.data?.role || 'Unknown',
                userId: verifiedToken?.data?.userId || 'Unknown',
                email: verifiedToken?.data?.email || 'Unknown',
                ipAddress: req.ip || req.connection.remoteAddress,
                headers: req.headers
            });
            return res.status(403).json({ message: 'Access denied. Only SuperAdmin and CRO can add leads.' });
        }

        // If the user is authorized, proceed to add the lead
        const result = await LeadsService.addLead(req.body, verifiedToken.data.user);
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in LeadsController - /add:', {
            message: error.message,
            stack: error.stack,
            body: req.body,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error);
    }
});



router.get('/notifications', async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Authentication token missing.' });

        const verifiedToken = await verifyToken(token);
        const userId = verifiedToken?.data?.user;
        if (!userId) return res.status(401).json({ message: 'Invalid token.' });

        // Fetch unread notifications for the user
        const notifications = await Notification.find({ userId, isRead: false })
            .populate('leadId', 'Name');

        res.status(200).json({ status: 200, data: notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications.' });
    }
});





module.exports = router;