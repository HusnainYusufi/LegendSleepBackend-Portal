const mongoose = require('mongoose');

const CitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    stateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const City = mongoose.model('City', CitySchema);

module.exports = City;
