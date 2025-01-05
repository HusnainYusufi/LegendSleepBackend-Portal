const mongoose = require('mongoose');

const sharedServiceSchema = new mongoose.Schema({

    ScreenName: {
        type: String
    },
    MaleVoice: [String],
    FemaleVoice: [String],
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const SharedServices = mongoose.model('SharedServices' ,  sharedServiceSchema);

module.exports = SharedServices;