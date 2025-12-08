const recentUpdateService = require('../services/recentUpdateService');
const ApiResponse = require('../utils/response');

const getRecentUpdates = async (req, res) => {
  try {
    const adminId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    
    const updates = await recentUpdateService.getRecentUpdates(adminId, limit);
    
    return ApiResponse.success(res, updates, 'Recent updates retrieved successfully');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to retrieve recent updates', 500);
  }
};

module.exports = {
  getRecentUpdates
};