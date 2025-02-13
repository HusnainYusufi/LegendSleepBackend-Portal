const cron = require('node-cron');
const moment = require('moment');
const Activity = require('../models/LeadActivity.model');
const Notification = require('../models/Notification.model');

cron.schedule('0 * * * *', async () => {
    try {
        console.log('Running Follow-up Notification Job...');

        const today = moment().startOf('day').toDate();

        // Find overdue activities
        const overdueActivities = await Activity.find({
            followUpDate: { $lt: today }
        }).populate('userId', 'username');

        if (!overdueActivities.length) {
            console.log('No overdue follow-ups.');
            return;
        }

        for (const activity of overdueActivities) {
            if (!activity.userId) {
                console.warn(`Skipping activity ${activity._id} as userId is missing.`);
                continue; // Skip processing this activity
            }

            // Check if a notification already exists
            const existingNotification = await Notification.findOne({
                userId: activity.userId._id,
                leadId: activity.leadId,
                notified: true
            });

            if (!existingNotification) {
                // Create a new notification
                await Notification.create({
                    userId: activity.userId._id,
                    leadId: activity.leadId,
                    message: `Your follow-up for Lead #${activity.leadId} is overdue.`,
                    notified: true
                });

                console.log(`Notification stored for user: ${activity.userId.username}`);
            }
        }
    } catch (error) {
        console.error('Error in Follow-up Notification Job:', error);
    }
});

module.exports = cron;
