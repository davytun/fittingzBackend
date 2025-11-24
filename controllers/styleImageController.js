const { validationResult } = require("express-validator");
const StyleImageService = require("../services/styleImageService");
const { cloudinary } = require("../config/cloudinary");

exports.uploadStyleImage = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          await cloudinary.uploader.destroy(file.public_id);
        }
      } catch (cloudinaryError) {
        console.error(
          "Error deleting files from Cloudinary after validation error:",
          cloudinaryError
        );
      }
    }
    return res.status(400).json({ errors: errors.array() });
  }

  const { clientId } = req.params;
  const { category, description } = req.body || {};
  const adminId = req.user.id;

  console.log('Upload request:', {
    files: req.files,
    body: req.body,
    headers: req.headers['content-type']
  });

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ 
      message: "No image files uploaded.",
      debug: {
        files: req.files,
        hasFiles: !!req.files,
        filesLength: req.files ? req.files.length : 0
      }
    });
  }

  try {
    const styleImages = await StyleImageService.uploadStyleImageForClient({
      clientId,
      adminId,
      files: req.files,
      category,
      description,
    });
    res.status(201).json(styleImages);
  } catch (error) {
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          await cloudinary.uploader.destroy(file.public_id);
        }
      } catch (cloudinaryError) {
        console.error(
          "Error deleting files from Cloudinary after error:",
          cloudinaryError
        );
      }
    }
    if (error.message === "Client not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("Forbidden")) {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
};

exports.uploadStyleImageForAdmin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          await cloudinary.uploader.destroy(file.public_id);
        }
      } catch (cloudinaryError) {
        console.error(
          "Error deleting files from Cloudinary after validation error:",
          cloudinaryError
        );
      }
    }
    return res.status(400).json({ errors: errors.array() });
  }

  const { category, description } = req.body || {};
  const adminId = req.user.id;

  try {
    const styleImages = await StyleImageService.uploadStyleImageForAdmin({
      adminId,
      files: req.files,
      category,
      description,
    });
    res.status(201).json(styleImages);
  } catch (error) {
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          await cloudinary.uploader.destroy(file.public_id);
        }
      } catch (cloudinaryError) {
        console.error(
          "Error deleting files from Cloudinary after error:",
          cloudinaryError
        );
      }
    }
    next(error);
  }
};

exports.getStyleImagesByClientId = async (req, res, next) => {
  const { clientId } = req.params;
  const adminId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;

  try {
    const result = await StyleImageService.getStyleImagesByClientId({
      clientId,
      adminId,
      page,
      pageSize,
    });
    res.status(200).json(result);
  } catch (error) {
    if (error.message === "Client not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("Forbidden")) {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
};

exports.getStyleImageById = async (req, res, next) => {
  const { clientId, imageId } = req.params;
  const adminId = req.user.id;

  try {
    const result = await StyleImageService.getStyleImageById({
      clientId,
      imageId,
      adminId,
    });
    res.status(200).json(result);
  } catch (error) {
    if (error.message === "Style image not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "Client not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("Forbidden")) {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
};

exports.getStyleImagesByAdmin = async (req, res, next) => {
  const adminId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;

  try {
    const result = await StyleImageService.getStyleImagesByAdmin({
      adminId,
      page,
      pageSize,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteStyleImage = async (req, res, next) => {
  const { imageId } = req.params;
  const adminId = req.user.id;

  try {
    const result = await StyleImageService.deleteStyleImage({
      imageId,
      adminId,
    });
    res.status(200).json(result);
  } catch (error) {
    if (error.message === "Style image not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("Forbidden")) {
      return res.status(403).json({ message: error.message });
    }
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ message: "Style image not found or already deleted." });
    }
    next(error);
  }
};

exports.getStyleImagesCount = async (req, res, next) => {
  try {
    const result = await StyleImageService.getStyleImagesCount();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateStyleImage = async (req, res, next) => {
  const { imageId } = req.params;
  const { category, description } = req.body;
  const adminId = req.user.id;

  try {
    const updatedStyleImage = await StyleImageService.updateStyleImage({
      imageId,
      adminId,
      category,
      description,
    });
    res.status(200).json(updatedStyleImage);
  } catch (error) {
    if (error.message === "Style image not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("Forbidden")) {
      return res.status(403).json({ message: error.message });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Style image not found" });
    }
    next(error);
  }
};

exports.deleteMultipleStyleImages = async (req, res, next) => {
  const { imageIds } = req.body || {};
  const adminId = req.user.id;

  try {
    const { deletedCount, failedCount, failedImages } =
      await StyleImageService.deleteMultipleStyleImages({
        imageIds,
        adminId,
      });

    if (deletedCount > 0) {
      res.status(200).json({
        message: `${deletedCount} image(s) deleted successfully.`,
        deletedCount,
        failedCount,
        failedImages,
      });
    } else if (failedCount > 0) {
      res.status(400).json({
        message: `Failed to delete ${failedCount} image(s).`,
        deletedCount,
        failedCount,
        failedImages,
      });
    } else {
      res
        .status(200)
        .json({ message: "No images were processed for deletion." });
    }
  } catch (error) {
    if (error.message === "No image IDs provided for deletion.") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};
