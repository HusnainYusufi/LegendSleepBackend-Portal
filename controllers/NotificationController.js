const express = require('express');
const AuthService = require('../services/AuthService');
const ForgotPassword = require('../services/ForgotPassword');
const UserService = require('../services/UserService');
const NotificationService = require('../services/NotificationService');
const router = express.Router();

router.post('/add', async (req, res) => {
    try {
        let result = await NotificationService.addNotification({ ...req.body });
        return res.json(result); // Respond with the result
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Something went wrong!' }); // Send a response even in case of error
    }
});




module.exports = router;
