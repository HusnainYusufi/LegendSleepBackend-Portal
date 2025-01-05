const mongoose = require('mongoose');

const CountrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    isoCode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    states: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'State'
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Country = mongoose.model('Country', CountrySchema);

module.exports = Country;
