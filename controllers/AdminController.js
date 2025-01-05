const express = require('express');
const router = express.Router();
const AdminService = require('../services/AdminService');

// Route to get all users
router.get('/all/users', async (req, res) => {
    try {
        let tokken = req.headers['authorization'].split(' ')[1];
        const response = await AdminService.getAllUsers();
        res.status(response.status).json({ message: response.message, result: response.result });
    } catch (error) {
        console.error("Error in /admin/all-users route:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
router.get('/single/user:id', async (req, res) => {
    try {
        let userId = req.params.id;
        const response = await AdminService.getUserDetailById({userId});
        res.status(response.status).json({ message: response.message, result: response.result });
    } catch (error) {
        console.error("Error in /admin/all-users route:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


router.get('/single/user/all/Details:id', async (req, res) => {
    try {
        let userId = req.params.id;
        const response = await AdminService.getSingleUserAllDetailById({userId});
        res.status(response.status).json({ message: response.message, result: response.result });
    } catch (error) {
        console.error("Error in /admin/all-users route:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get('/dashboard/summary', async (req, res) => {
    try {
        const response = await AdminService.getDashboardSummary();
        res.status(response.status).json({ message: response.message, result: response.result });
    } catch (error) {
        console.error("Error in /admin/all-users route:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
module.exports = router;
