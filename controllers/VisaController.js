const express = require('express');
const router = express.Router();
const VisaTypeService = require('../services/VisaService');
const logger = require('../modules/logger'); 

// Route to add a visa type
router.post('/add', async (req, res, next) => {
    try {
        const result = await VisaTypeService.addVisaType(req.body);
        return res.json(result);
    } catch (error) {
        logger.error('Error in VisaTypeController - Add VisaType:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
});

// Route to get all visa types
router.get('/all', async (req, res, next) => {
    try {
        const result = await VisaTypeService.getAllVisaTypes();
        return res.json(result);
    } catch (error) {
        logger.error('Error in VisaTypeController - Get All VisaTypes:', {
            message: error.message,
            stack: error.stack
        });
        next(error);
    }
});

module.exports = router;
