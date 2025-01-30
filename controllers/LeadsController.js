const express = require('express');
const router = express.Router();
const LeadsService = require('../services/LeadsService'); // Import LeadsService
const { verifyToken } = require('../modules/helper'); // Import verifyToken for role extraction
const logger = require('../modules/logger'); // Import logger
const leadUpload = require('../services/leadUpload'); // Import the leads multer middleware
const XLSX = require('xlsx'); // Import xlsx for Excel parsing
const fs = require('fs');
const path = require('path');

// Route to add a lead
router.post('/add', async (req, res, next) => {
    try {

        console.log(req.body);
        // Extract the token from the Authorization header
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        // Verify the token and extract the user's role
        const verifiedToken = await verifyToken(token);
        console.log(verifiedToken);

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
        console.log(verifiedToken);

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

        // Optional: Log the parsed data
        console.log('Parsed Leads:', jsonData);

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

// Route to fetch all leads (Accessible only by SuperAdmin)
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

        // Check if the user has the required role (SuperAdmin)
        const userRole = verifiedToken?.data?.userType?.toLowerCase();
        if (userRole !== 'superadmin') {
            logger.error('Unauthorized access attempt in LeadsController - GET /:', {
                message: "Unauthorized access",
                role: userRole || 'Unknown',
                userId: verifiedToken?.data?.userId || 'Unknown',
                email: verifiedToken?.data?.email || 'Unknown',
                ipAddress: req.ip || req.connection.remoteAddress,
                headers: req.headers
            });
            return res.status(403).json({ message: 'Access denied. Only SuperAdmin can view all leads.' });
        }

        // If authorized, fetch all leads
        const result = await LeadsService.getAllLeads();

        return res.status(result.status).json(result);
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


module.exports = router;