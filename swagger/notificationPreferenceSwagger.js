/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationPreference:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         adminId:
 *           type: string
 *         emailNotifications:
 *           type: boolean
 *           description: Enable/disable email notifications
 *         pushNotifications:
 *           type: boolean
 *           description: Enable/disable push notifications
 *         orderStatusUpdates:
 *           type: boolean
 *           description: Receive order status change notifications
 *         paymentAlerts:
 *           type: boolean
 *           description: Receive payment received notifications
 *         clientReminders:
 *           type: boolean
 *           description: Receive client-related reminders
 *         systemAlerts:
 *           type: boolean
 *           description: Receive system alerts and warnings
 *         weeklyReports:
 *           type: boolean
 *           description: Receive weekly business reports via email
 *         highValueOrderThreshold:
 *           type: integer
 *           description: Minimum amount for high-value order alerts
 *           default: 75000
 *         inactiveClientDays:
 *           type: integer
 *           description: Days before marking clients as inactive
 *           default: 30
 *         overdueOrderAlerts:
 *           type: boolean
 *           description: Receive overdue order notifications
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/notification-preferences:
 *   get:
 *     summary: Get notification preferences
 *     description: Retrieve current notification preferences for the authenticated admin
 *     tags: [Notification Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/NotificationPreference'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/notification-preferences:
 *   put:
 *     summary: Update notification preferences
 *     description: Update notification preferences for the authenticated admin
 *     tags: [Notification Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *               pushNotifications:
 *                 type: boolean
 *               orderStatusUpdates:
 *                 type: boolean
 *               paymentAlerts:
 *                 type: boolean
 *               clientReminders:
 *                 type: boolean
 *               systemAlerts:
 *                 type: boolean
 *               weeklyReports:
 *                 type: boolean
 *               highValueOrderThreshold:
 *                 type: integer
 *               inactiveClientDays:
 *                 type: integer
 *               overdueOrderAlerts:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/NotificationPreference'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */