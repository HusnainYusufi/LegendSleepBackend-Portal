const mongoose = require('mongoose');


const ForgotPasswordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    isUsed: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true
});

const ForgotPassword = mongoose.model('ForgotPassword' , ForgotPasswordSchema);
module.exports = ForgotPassword;