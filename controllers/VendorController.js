const express = require('express');
const router = express.Router();
const VendorService = require('../services/VendorService');
const logger = require('../modules/logger');
const { verifyToken } = require('../modules/helper');

router.post('/onboard/client', async (req, res, next) => {
    try {
        let token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authorization token is missing.' });
        }

        const verifiedToken = await verifyToken(token);
        if (verifiedToken?.data?.userType === 'Vendor') {
            const response = await VendorService.onboardClientAndOrder({
                createdBy: verifiedToken.data.user, // Vendor ID
                ...req.body
            });
            res.status(response.status).json(response);
        } else {
            logger.error('Unauthorized access attempt in VendorController - /onboard/client:', {
                message: "Unauthorized access",
                role: verifiedToken?.data?.role || 'Unknown',
                userId: verifiedToken?.data?.userId || 'Unknown',
                email: verifiedToken?.data?.email || 'Unknown',
                ipAddress: req.ip || req.connection.remoteAddress,
                headers: req.headers
            });
            return res.status(403).json({ message: 'Access denied. Only Vendors can access this resource.' });
        }
    } catch (error) {
        logger.error('Error in VendorController - /onboard/client:', {
            message: error.message,
            stack: error.stack,
            headers: req.headers,
            body: req.body,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error);
    }
});

router.get('/clients', async (req, res, next) => {
    try {
        let token = req.headers['authorization']?.split(' ')[1];

        const verifiedToken = await verifyToken(token);
        const response = await VendorService.getVendorClients({
            vendorId: verifiedToken.data.user
        });
        return res.json(response);
       
    } catch (error) {
        logger.error('Error in VendorController - /onboard/client:', {
            message: error.message,
            stack: error.stack,
            headers: req.headers,
            body: req.body,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error);
    }
});


// Route for updating the order status
router.post('/update/status', async (req, res, next) => {
    try {
    
        const token = req.headers['authorization']?.split(' ')[1];
        const verifiedToken = await verifyToken(token);

        // Ensure the user is a Vendor
        if (verifiedToken?.data?.userType === 'Vendor') {
            console.log(verifiedToken.data.user);
            const response = await VendorService.updateOrderStatus({
                vendorId: verifiedToken.data.user, 
                ...req.body, 
            });
            return res.status(response.status).json(response);
        } else {
            logger.error('Unauthorized access attempt in VendorController - /update/status:', {
                message: "Unauthorized access",
                userType: verifiedToken?.data?.userType || 'Unknown',
                userId: verifiedToken?.data?.userId || 'Unknown',
                email: verifiedToken?.data?.email || 'Unknown',
                ipAddress: req.ip || req.connection.remoteAddress,
                headers: req.headers,
            });
            return res.status(403).json({ message: 'Access denied. Only Vendors can access this resource.' });
        }
    } catch (error) {
        logger.error('Error in VendorController - /update/status:', {
            message: error.message,
            stack: error.stack,
            headers: req.headers,
            body: req.body,
            ipAddress: req.ip || req.connection.remoteAddress,
        });
        next(error);
    }
});

module.exports = router;
