const recentUpdateService = require('../services/recentUpdateService');
const notificationService = require('../services/notificationService');
const { getIO } = require('../socket');

const trackActivity = async (adminId, type, title, description, entityId, entityType) => {
  try {
    // Track the activity
    await recentUpdateService.createUpdate(adminId, type, title, description, entityId, entityType);
    
    // Emit real-time activity update
    getIO().to(`admin_${adminId}`).emit('activity_update', {
      type,
      title,
      description,
      timestamp: new Date()
    });
    
    // Generate smart notifications for important events
    await generateSmartNotification(adminId, type, title, description, entityId, entityType);
  } catch (error) {
    console.error('Failed to track activity:', error);
  }
};

const generateSmartNotification = async (adminId, type, title, description, entityId, entityType) => {
  try {
    const prisma = new (require('@prisma/client').PrismaClient)();
    
    switch (type) {
      case ActivityTypes.PAYMENT_RECEIVED:
        // Check if payment completes the order
        const order = await prisma.order.findUnique({
          where: { id: entityId },
          include: { payments: true }
        });
        if (order) {
          const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
          const isFullyPaid = totalPaid >= Number(order.price);
          
          await notificationService.createNotification(
            adminId,
            'PAYMENT_RECEIVED',
            isFullyPaid ? 'Order fully paid' : 'Payment received',
            isFullyPaid ? `Order #${order.orderNumber} is now fully paid` : description,
            { 
              priority: isFullyPaid ? 'HIGH' : 'MEDIUM', 
              entityId, 
              entityType, 
              actionUrl: `/orders/${entityId}` 
            }
          );
        }
        break;
        
      case ActivityTypes.ORDER_STATUS_CHANGED:
        if (description.includes('COMPLETED')) {
          await notificationService.createNotification(
            adminId,
            'ORDER_STATUS',
            'Order completed',
            description,
            { priority: 'LOW', entityId, entityType, actionUrl: `/orders/${entityId}` }
          );
        } else if (description.includes('CANCELLED')) {
          await notificationService.createNotification(
            adminId,
            'ORDER_STATUS',
            'Order cancelled',
            description,
            { priority: 'MEDIUM', entityId, entityType, actionUrl: `/orders/${entityId}` }
          );
        }
        break;
        
      case ActivityTypes.ORDER_CREATED:
        const newOrder = await prisma.order.findUnique({
          where: { id: entityId },
          include: { client: true }
        });
        
        if (newOrder) {
          // High-value order alert
          if (Number(newOrder.price) >= 75000) {
            await notificationService.createNotification(
              adminId,
              'ORDER_STATUS',
              'High-value order created',
              `New ₦${Number(newOrder.price).toLocaleString()} order from ${newOrder.client.name}`,
              { priority: 'HIGH', entityId, entityType, actionUrl: `/orders/${entityId}` }
            );
          }
          
          // Rush order alert (due within 7 days)
          if (newOrder.dueDate) {
            const daysUntilDue = Math.ceil((new Date(newOrder.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntilDue <= 7) {
              await notificationService.createNotification(
                adminId,
                'REMINDER',
                'Rush order created',
                `New order due in ${daysUntilDue} days`,
                { priority: 'URGENT', entityId, entityType, actionUrl: `/orders/${entityId}` }
              );
            }
          }
        }
        break;
        
      case ActivityTypes.CLIENT_CREATED:
        // Welcome notification for new clients
        const client = await prisma.client.findUnique({
          where: { id: entityId }
        });
        
        if (client) {
          await notificationService.createNotification(
            adminId,
            'CLIENT_ADDED',
            'New client added',
            `${client.name} has been added to your client list`,
            { priority: 'LOW', entityId, entityType, actionUrl: `/clients/${entityId}` }
          );
        }
        break;
    }
  } catch (error) {
    console.error('Failed to generate smart notification:', error);
  }
};

const ActivityTypes = {
  CLIENT_CREATED: 'CLIENT_CREATED',
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_STATUS_CHANGED: 'PROJECT_STATUS_CHANGED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  EVENT_CREATED: 'EVENT_CREATED',
  MEASUREMENT_ADDED: 'MEASUREMENT_ADDED'
};

module.exports = {
  trackActivity,
  ActivityTypes
};