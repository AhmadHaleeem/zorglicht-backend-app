const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload file to Cloudinary
const uploadToCloudinary = async (file, folder = 'documents') => {
    try {
        // Ensure file.originalname exists before using split
        const fileName = file.originalname || 'unknown';
        const fileNameWithoutExt = fileName.includes('.') ? fileName.split('.')[0] : fileName;
        
        const result = await cloudinary.uploader.upload(file.path, {
            folder: folder,
            resource_type: 'auto',
            public_id: `${Date.now()}_${fileNameWithoutExt}`,
            use_filename: true,
            unique_filename: false,
        });
        
        return {
            public_id: result.public_id,
            secure_url: result.secure_url,
            original_filename: fileName,
            format: result.format,
            resource_type: result.resource_type,
            bytes: result.bytes,
            created_at: result.created_at
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
};

// Get file metadata from Cloudinary
const getFileMetadata = async (publicId) => {
    try {
        const result = await cloudinary.api.resource(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary metadata error:', error);
        throw error;
    }
};

// Generate download URL
const generateDownloadUrl = (publicId, originalFilename) => {
    return cloudinary.url(publicId, {
        flags: 'attachment',
        resource_type: 'auto'
    });
};

module.exports = {
    cloudinary,
    uploadToCloudinary,
    deleteFromCloudinary,
    getFileMetadata,
    generateDownloadUrl
};