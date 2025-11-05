const { validationResult } = require('express-validator');
const ProfileService = require('../services/profileService');

class ProfileController {
  async getProfile(req, res, next) {
    try {
      const adminId = req.user.id;
      const profile = await ProfileService.getProfile({ adminId });
      res.status(200).json(profile);
    } catch (error) {
      if (error.message === 'Admin not found') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(401).json({ message: error.message });
      }
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const adminId = req.user.id;
      const { businessName, contactPhone, businessAddress } = req.body;
      const profileImage = req.file;
      const profile = await ProfileService.updateProfile({ 
        adminId, 
        businessName, 
        contactPhone, 
        businessAddress,
        profileImage
      });
      res.status(200).json(profile);
    } catch (error) {
      if (error.message === 'Admin not found') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(401).json({ message: error.message });
      }
      next(error);
    }
  }
}

module.exports = new ProfileController();