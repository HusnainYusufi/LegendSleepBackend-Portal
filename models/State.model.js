const mongoose = require('mongoose');

const StateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    countryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
        required: true
    },
    cities: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'City'
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const State = mongoose.model('State', StateSchema);

module.exports = State;
