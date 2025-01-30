const express = require('express');
const router = express.Router();
const LeadAssignmentService = require('../services/LeadAssignmentService');
const { verifyToken } = require('../modules/helper');
const logger = require('../modules/logger');

// Assign a lead to a user
router.post('/assign', async (req, res, next) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        const verifiedToken = await verifyToken(token);
        const { leadId, userId, remarks } = req.body;

        // Only SuperAdmin and CRO can assign leads
        const allowedRoles = ['superadmin', 'cro' , 'salesagent' , 'other'];
        if (!allowedRoles.includes(verifiedToken?.data?.userType?.toLowerCase())) {
            logger.error('Unauthorized lead assignment attempt', { userId: verifiedToken?.data?.userId });
            return res.status(403).json({ message: 'Access denied. Only SuperAdmin and CRO can assign leads.' });
        }

        const result = await LeadAssignmentService.assignLead(leadId, userId, verifiedToken.data.userId, remarks);
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in LeadAssignmentController - /assign:', {
            message: error.message,
            stack: error.stack
        });
        next(error);
    }
});

module.exports = router;
