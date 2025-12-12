/**
 * @swagger
 * /api/v1/email-test/test-alert:
 *   post:
 *     summary: Test critical notification email
 *     description: Sends a test high-priority notification email to verify email delivery
 *     tags: [Email Testing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test alert email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to send test email
 */

/**
 * @swagger
 * /api/v1/email-test/test-daily-digest:
 *   post:
 *     summary: Test daily digest email
 *     description: Sends a test daily business summary email with current statistics
 *     tags: [Email Testing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daily digest sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to send daily digest
 */

/**
 * @swagger
 * /api/v1/email-test/test-weekly-report:
 *   post:
 *     summary: Test weekly report email
 *     description: Sends a test weekly business report with comprehensive metrics
 *     tags: [Email Testing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weekly report sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to send weekly report
 */