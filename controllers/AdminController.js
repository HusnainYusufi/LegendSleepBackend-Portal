const express = require('express');
const router = express.Router();
const AdminService = require('../services/AdminService');
const UserService = require('../services/UserService');
const { verifyToken , sendEmail } = require('../modules/helper');
const logger = require('../modules/logger'); // Import logger


// ✅ Route to get all users (Only accessible by SuperAdmin)
router.get('/all-users', async (req, res, next) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        const verifiedToken = await verifyToken(token);
        if (!verifiedToken?.data?.userType || verifiedToken?.data?.userType.toLowerCase() !== 'superadmin') {
            logger.error('Unauthorized access attempt in AdminController - /all-users:', {
                userId: verifiedToken?.data?.userId || 'Unknown',
                email: verifiedToken?.data?.email || 'Unknown',
                ipAddress: req.ip || req.connection.remoteAddress
            });
            return res.status(403).json({ message: 'Access denied. Only SuperAdmin can view users.' });
        }

        // Fetch users from AdminService
        const result = await AdminService.getAllUsers();

        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in AdminController - /all-users:', {
            message: error.message,
            stack: error.stack,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error);
    }
});


router.post('/give/access', async (req, res, next) => {
    try {
        // Extract the token from the Authorization header
        let token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        console.log(req.body);
        // Verify the token
        const verifiedToken = await verifyToken(token);

        // Check if the user is SuperAdmin
        if (verifiedToken?.data?.userType === 'superadmin') {
            // Add the vendor
            const response = await AdminService.addVendor({
                createdBy: verifiedToken.data.user,
                ...req.body
            });

            // Send the response to the client immediately
            res.json(response);

            // If the vendor was successfully created, send the email asynchronously
            if (response.status === 201) {
                const user = response.result; // Vendor created

                // Generate the reset link with the user's email
                const resetLink = `http://localhost/LegendSleep-Ticketing/setPassword.php?email=${encodeURIComponent(user.email)}`;

                // Generate the HTML email content
                const emailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="background-color: #f4f4f4; padding: 20px;">
                        <h2 style="text-align: center; color: #555;">Welcome to Legend Sleep Ticketing Portal</h2>
                        <p style="font-size: 16px;">
                            Hello <strong>${user.username}</strong>,<br><br>
                            Welcome to Legend Sleep Ticketing Portal! We're thrilled to have you onboard.
                        </p>
                        <p style="font-size: 16px;">
                            Please click the link below to set your password and access your portal:
                        </p>
                        <p style="font-size: 16px; text-align: center;">
                            <a href="${resetLink}" target="_blank" style="background-color: #007BFF; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                Set Your Password
                            </a>
                        </p>
                        <p style="font-size: 16px;">
                            If you have any questions, feel free to reach out to us at <a href="mailto:uzairyusufi5@gmail.com" style="color: #0066cc;">uzairyusufi5@gmail.com</a>.
                        </p>
                        <p style="text-align: center; font-size: 16px;">
                            Best regards,<br>
                            <strong>The Legend Sleep Team</strong>
                        </p>
                    </div>
                </div>`;

                // Asynchronously send the email without blocking the response
                sendEmail({
                    from: process.env.MAIL_USER,
                    to: user.email,
                    subject: 'Set Your Password - Legend Sleep Portal',
                    html: emailHtml
                }).catch(error => {
                    // Log the error without affecting the response
                    logger.error('Error sending welcome email:', {
                        message: error.message,
                        stack: error.stack,
                        userId: user._id,
                        email: user.email
                    });
                });
            }
        } else {
            // Unauthorized access
            logger.error('Unauthorized access attempt in AdminController - /give/access:', {
                message: "Unauthorized access",
                role: verifiedToken?.data?.role || 'Unknown',
                userId: verifiedToken?.data?.userId || 'Unknown',
                email: verifiedToken?.data?.email || 'Unknown',
                ipAddress: req.ip || req.connection.remoteAddress,
                headers: req.headers
            });
            return res.status(403).json({ message: 'Access denied. Only SuperAdmin can access this resource.' });
        }
    } catch (error) {
        // Log the error with detailed context
        logger.error('Error in AdminController - /give/access:', {
            message: error.message,
            stack: error.stack,
            headers: req.headers,
            body: req.body,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error);
    }
});


module.exports = router;
