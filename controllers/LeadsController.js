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

// Route to import leads from Excel/CSV
router.post('/import', leadUpload.single('file'), async (req, res, next) => {
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
            logger.error('Unauthorized access attempt in LeadsController - /import:', {
                message: "Unauthorized access",
                role: verifiedToken?.data?.role || 'Unknown',
                userId: verifiedToken?.data?.userId || 'Unknown',
                email: verifiedToken?.data?.email || 'Unknown',
                ipAddress: req.ip || req.connection.remoteAddress,
                headers: req.headers
            });
            return res.status(403).json({ message: 'Access denied. Only SuperAdmin and CRO can import leads.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded. Please upload an Excel or CSV file.' });
        }

        // Path to the uploaded file
        const filePath = path.resolve(req.file.path);

        // Read the uploaded file
        const workbook = XLSX.readFile(filePath);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
            // Delete the uploaded file as it's empty
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting the uploaded empty file:', err);
                } else {
                    console.log('Uploaded empty file deleted successfully.');
                }
            });
            return res.status(400).json({ message: 'The uploaded file is empty.' });
        }

      

        // Process and add leads using the service
        const result = await LeadsService.addLeads(jsonData, verifiedToken.data.user);

        // Delete the uploaded file after processing
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting the uploaded file:', err);
                // Not critical, so don't block the response
            } else {
                console.log('Uploaded file deleted successfully.');
            }
        });

        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in LeadsController - /import:', {
            message: error.message,
            stack: error.stack,
            body: req.body,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error);
    }
});

// Route to fetch all leads (SuperAdmin gets all, others get assigned leads)
router.get('/', async (req, res, next) => {
    try {
        // Extract the token from the Authorization header
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        // Verify the token and extract the user's role
        const verifiedToken = await verifyToken(token);

        if (!verifiedToken) {
            return res.status(401).json({ message: 'Invalid authentication token.' });
        }

        const userId = verifiedToken?.data?.user;
        const userRole = verifiedToken?.data?.userType?.toLowerCase();

        // If user is a SuperAdmin, fetch all leads
        if (userRole === 'superadmin') {
            const result = await LeadsService.getAllLeads();
            return res.status(result.status).json(result);
        } else {
            // If user is CRO, Sales Agent, or any other role, fetch only assigned leads
            const result = await LeadsService.getUserLeads(userId);
            return res.status(result.status).json(result);
        }
    } catch (error) {
        logger.error('Error in LeadsController - GET /:', {
            message: error.message,
            stack: error.stack,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error);
    }
});


// Route to update a lead by ID
router.put('/update/:id', async (req, res, next) => {
    try {
        // Extract lead ID from request params
        const { id } = req.params;
        const updateFields = req.body;

        // Extract and verify the authentication token
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        const verifiedToken = await verifyToken(token);

        // Allow only specific roles to update leads
        const allowedRoles = ['superadmin', 'cro'];
        if (!allowedRoles.includes(verifiedToken?.data?.userType?.toLowerCase())) {
            logger.error('Unauthorized lead update attempt', {
                role: verifiedToken?.data?.userType || 'Unknown',
                userId: verifiedToken?.data?.userId || 'Unknown',
                ipAddress: req.ip || req.connection.remoteAddress
            });
            return res.status(403).json({ message: 'Access denied. Only SuperAdmin and CRO can update leads.' });
        }

        // Call service to update the lead
        const result = await LeadsService.updateLeadById(id, updateFields);

        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in LeadsController - /update/:id', {
            message: error.message,
            stack: error.stack,
            body: req.body,
            params: req.params,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error);
    }
});

// Add a discussion to a lead
router.post('/discussion/add', async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        const verifiedToken = await verifyToken(token);
        const userId = verifiedToken?.data?.user;

        if (!userId) {
            return res.status(401).json({ message: 'Invalid token. Unable to retrieve user ID.' });
        }

        const { leadId, message } = req.body;

        // Call service to add discussion
        const result = await LeadsService.addDiscussion(leadId, userId, message);
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in LeadsController - /discussion/add:', {
            message: error.message,
            stack: error.stack
        });
        next(error);
    }
});

// Fetch discussions for a lead
router.get('/discussion/:leadId', async (req, res, next) => {
    try {
        const { leadId } = req.params;

        // Fetch discussions
        const result = await LeadsService.getDiscussionsByLead(leadId);
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in LeadsController - GET /discussion/:leadId:', {
            message: error.message,
            stack: error.stack
        });
        next(error);
    }
});

// Add or update a lead activity (Discussion, Follow-up, Status Update)
router.post('/activity/add', async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        const verifiedToken = await verifyToken(token);
        const userId = verifiedToken?.data?.user;
        if (!userId) {
            return res.status(401).json({ message: 'Invalid token. Unable to retrieve user ID.' });
        }

        const { leadId, type, status, comment, followUpDate } = req.body;

        // Call service to add or update activity
        const result = await LeadsService.addOrUpdateActivity({
            leadId,
            userId,
            type,
            status,
            comment,
            followUpDate
        });

        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in LeadsController - /activity/add:', {
            message: error.message,
            stack: error.stack
        });
        next(error);
    }
});

// Fetch all activities for a lead
router.get('/activity/:leadId', async (req, res, next) => {
    try {
        const { leadId } = req.params;

        // Fetch activities
        const result = await LeadsService.getActivitiesByLead(leadId);
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in LeadsController - GET /activity/:leadId:', {
            message: error.message,
            stack: error.stack
        });
        next(error);
    }
});

/**
 * Get all follow-ups saved by the authenticated user
 */
router.get('/my-followups', async (req, res, next) => {
    try {
        // Extract the token from headers
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        // Verify token and extract user ID
        const verifiedToken = await verifyToken(token);
        const userId = verifiedToken?.data?.user;

        if (!userId) {
            return res.status(401).json({ message: 'Invalid authentication token.' });
        }

        // Fetch all follow-ups created by this user
        const result = await LeadsService.getUserFollowUps(userId);

        return res.status(result.status).json(result);

    } catch (error) {
        logger.error('Error in LeadsController - GET /my-followups:', {
            message: error.message,
            stack: error.stack
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

router.post('/notifications/markRead/:notificationId', async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Authentication token missing.' });

        const verifiedToken = await verifyToken(token);
        const userId = verifiedToken?.data?.user;
        if (!userId) return res.status(401).json({ message: 'Invalid token.' });

        const { notificationId } = req.params;

        // Find and update the specific notification
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found or already marked read.' });
        }

        res.status(200).json({ status: 200, message: 'Notification marked as read.', data: notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Failed to update notification.' });
    }
});

// Toggle Remarketing Status Route
router.put('/toggle-remarketing/:id', async (req, res, next) => {
   
    try {
        // Extract and verify the authentication token
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        const verifiedToken = await verifyToken(token);
        const userId = verifiedToken?.data?.user;

        if (!userId) {
            return res.status(403).json({ message: 'Invalid authentication.' });
        }

        // Call service to toggle remarketing
        const result = await LeadsService.toggleRemarketing(req.params.id);
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in LeadsController - /toggle-remarketing/:id:', {
            message: error.message,
            stack: error.stack,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error);
    }
});

// Route to get remarketing leads
router.get('/remarketing', async (req, res, next) => {
    try {
        // Extract and verify the authentication token
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        const verifiedToken = await verifyToken(token);
        const userId = verifiedToken?.data?.user;
        const userType = verifiedToken?.data?.userType?.toLowerCase();

        if (!userId) {
            return res.status(403).json({ message: 'Invalid authentication.' });
        }

        // Fetch remarketing leads based on role
        const result = await LeadsService.getRemarketingLeads(userId, userType);
        return res.status(result.status).json(result);

    } catch (error) {
        logger.error('Error in LeadsController - /remarketing:', {
            message: error.message,
            stack: error.stack,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error);
    }
});

/**
 * Update qualified status of a lead
 * @route PUT /leads/qualified-status/:leadId
 */
router.put('/qualified-status/:leadId', async (req, res, next) => {
    try {
        // Extract and verify the authentication token
        const token = req.headers['authorization']?.split(' ')[1];
        
        const verifiedToken = await verifyToken(token);
        const userId = verifiedToken?.data?.user;
        const userType = verifiedToken?.data?.userType?.toLowerCase();

        if (!userId) {
            return res.status(403).json({ message: 'Invalid authentication.' });
        }

        // Extract lead ID and new status from request
        const { leadId } = req.params;
        const { qualifiedStatus } = req.body; // Expect "qualified" or "unqualified"

        if (!['qualified', 'unqualified'].includes(qualifiedStatus.toLowerCase())) {
            return res.status(400).json({ message: 'Invalid qualifiedStatus value. Allowed values: "qualified", "unqualified".' });
        }

        // Update qualified status
        const result = await LeadsService.updateQualifiedStatus(leadId, qualifiedStatus);
        return res.status(result.status).json(result);

    } catch (error) {
        logger.error('Error in LeadsController - /qualified-status/:leadId', {
            message: error.message,
            stack: error.stack,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error);
    }
});



/**
 * Fetch lead counts based on user type
 * @route GET /leads/counts
 */
router.get('/counts', async (req, res, next) => {
    try {
        // Extract and verify the authentication token
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        const verifiedToken = await verifyToken(token);
        const userId = verifiedToken?.data?.user;
        const userType = verifiedToken?.data?.userType?.toLowerCase();

        if (!userId) {
            return res.status(403).json({ message: 'Invalid authentication.' });
        }

        // Fetch lead counts based on user type
        const result = await LeadsService.getLeadCounts(userId, userType);
        return res.status(result.status).json(result);

    } catch (error) {
        logger.error('Error in LeadsController - /counts:', {
            message: error.message,
            stack: error.stack,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error);
    }
});

/**
 * Fetch leads based on filter criteria with role-based access
 */
router.get('/filter', async (req, res, next) => {
    try {
        // Extract the token from the request
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        // Verify the user token
        const verifiedToken = await verifyToken(token);
        const userId = verifiedToken?.data?.user;
        const userRole = verifiedToken?.data?.userType?.toLowerCase();

        if (!userId) {
            return res.status(401).json({ message: 'Invalid authentication token.' });
        }

        // Extract filters from query params
        const filters = req.query;

        // Fetch filtered leads with role-based restrictions
        const result = await LeadsService.getFilteredLeads(filters, userId, userRole);

        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in LeadsController - GET /filter:', {
            message: error.message,
            stack: error.stack
        });
        next(error);
    }
});



module.exports = router;