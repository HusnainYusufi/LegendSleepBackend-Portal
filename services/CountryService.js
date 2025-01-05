const Country = require('../models/Country.model');
const State = require('../models/State.model');
const City = require('../models/City.model');
const logger = require('../modules/logger'); // Import the logger

class CountryService {
    static async addCountry(data) {
        try {
            const { name, isoCode } = data;

            if (!name || !isoCode) {
                return { status: 400, message: 'Name and ISO code are required' };
            }

            const country = new Country({ name, isoCode });
            const savedCountry = await country.save();

            return { status: 201, message: 'Country added successfully', data: savedCountry };
        } catch (error) {
            logger.error('Error in CountryService - Add Country:', {
                message: error.message,
                stack: error.stack,
                data
            });
            throw error;
        }
    }

    static async addState(data) {
        try {
            const { name, countryId } = data;

            if (!name || !countryId) {
                return { status: 400, message: 'Name and country ID are required' };
            }

            const state = new State({ name, countryId });
            const savedState = await state.save();

            await Country.findByIdAndUpdate(
                countryId,
                { $push: { states: savedState._id } },
                { new: true }
            );

            return { status: 201, message: 'State added successfully', data: savedState };
        } catch (error) {
            logger.error('Error in CountryService - Add State:', {
                message: error.message,
                stack: error.stack,
                data
            });
            throw error;
        }
    }

    static async addCity(data) {
        try {
            const { name, stateId } = data;

            if (!name || !stateId) {
                return { status: 400, message: 'Name and state ID are required' };
            }

            const city = new City({ name, stateId });
            const savedCity = await city.save();

            await State.findByIdAndUpdate(
                stateId,
                { $push: { cities: savedCity._id } },
                { new: true }
            );

            return { status: 201, message: 'City added successfully', data: savedCity };
        } catch (error) {
            logger.error('Error in CountryService - Add City:', {
                message: error.message,
                stack: error.stack,
                data
            });
            throw error;
        }
    }

    static async getAllCountries() {
        try {
            const countries = await Country.find({})
                .populate('states')
                .lean();

            return { status: 200, message: 'Countries fetched successfully', data: countries };
        } catch (error) {
            logger.error('Error in CountryService - Get All Countries:', {
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = CountryService;
