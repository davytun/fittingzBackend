const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error("FATAL ERROR: Cloudinary credentials are not defined in .env file. Image uploads will not work.");
    // Consider throwing an error or having a more graceful fallback if appropriate
} else {
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true, // Ensures HTTPS URLs
    });
    console.log("Cloudinary configured successfully.");
}

// Configure multer-storage-cloudinary
// This sets up Cloudinary as the storage engine for Multer.
// Images will be uploaded to a folder named 'style_inspirations' in Cloudinary.
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // req.body will contain other form fields, like 'category' or 'description'
        // req.params might contain clientId if it's part of the URL
        // We can use these to dynamically set folder or tags if needed

        // Extract client ID from request if available (e.g., from route params or body)
        // For now, let's assume clientId might be passed in req.params or derived
        // from the authenticated user context.
        // This example uses a generic folder, but you could customize it per client or admin.
        // e.g., `folder: \`user_${req.user.id}/client_${req.params.clientId}/styles\`,`

        // Generate a unique public_id for the image
        // This helps avoid overwriting files with the same name and can include client/admin identifiers
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.originalname.split('.')[0]; // Use original filename without extension

        // Determine folder based on the route or field name
        const isProfileImage = file.fieldname === 'profileImage';
        const folder = isProfileImage ? 'profile_images' : 'style_inspirations';
        const prefix = isProfileImage ? 'profile' : 'style';
        
        return {
            folder: folder,
            public_id: `${prefix}_${filename}_${uniqueSuffix}`,
            transformation: isProfileImage ? [{ width: 400, height: 400, crop: 'fill' }] : undefined
        };
    },
});

// Multer upload instance configured for Cloudinary
// Limits file size to 5MB and accepts common image formats.
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload only images.'), false);
        }
    },
});

module.exports = { cloudinary, upload };
