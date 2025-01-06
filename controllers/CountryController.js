const express = require('express');
const router = express.Router();
const CountryService = require('../services/CountryService');
const logger = require('../modules/logger'); // Import the logger
// const validate = require('../middlewares/joi.validation'); // Import Joi middleware
// const { countrySchema, stateSchema, citySchema } = require('../config/validator'); // Import validation schemas


router.post('/add',  async (req, res, next) => {
    try {
        const result = await CountryService.addCountry(req.body);
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in CountryController - Add Country:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
});


router.post('/state/add',  async (req, res, next) => {
    try {
        const result = await CountryService.addState(req.body);
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in CountryController - Add State:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
});


router.post('/city/add',  async (req, res, next) => {
    try {
        const result = await CountryService.addCity(req.body);
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in CountryController - Add City:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
});


router.get('/all', async (req, res, next) => {
    try {
        const result = await CountryService.getAllCountries();
        return res.json(result);
    } catch (error) {
        logger.error('Error in CountryController - Get All Countries:', {
            message: error.message,
            stack: error.stack
        });
        next(error);
    }
});

module.exports = router;
