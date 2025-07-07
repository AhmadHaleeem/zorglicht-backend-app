const multer = require('multer');
const path = require('path');
const { uploadToCloudinary, deleteFromCloudinary, getFileMetadata, generateDownloadUrl } = require('../config/cloudinary');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/temp/'); // Temporary storage before Cloudinary upload
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common file types
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Alleen afbeeldingen en documenten zijn toegestaan!'));
        }
    }
});

// Function to upload file to Cloudinary
async function uploadToCloudinaryFromFile(file) {
    try {
        const result = await uploadToCloudinary(file, 'employee-documents');
        
        // Clean up temporary file
        const fs = require('fs');
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        
        return {
            fileName: file.originalname,
            cloudinaryPublicId: result.public_id,
            cloudinaryUrl: result.secure_url,
            downloadUrl: result.secure_url,
            size: result.bytes,
            type: result.resource_type
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
}

// Delete file from Cloudinary
async function deleteFromCloudinaryByPublicId(publicId) {
    try {
        const result = await deleteFromCloudinary(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
}

// Get file metadata from Cloudinary
async function getCloudinaryFileMetadata(publicId) {
    try {
        const metadata = await getFileMetadata(publicId);
        return metadata;
    } catch (error) {
        console.error('Cloudinary metadata error:', error);
        throw error;
    }
}

// Generate download URL for Cloudinary file
async function generateCloudinaryDownloadUrl(publicId) {
    try {
        const url = await generateDownloadUrl(publicId);
        return url;
    } catch (error) {
        console.error('Cloudinary URL generation error:', error);
        throw error;
    }
}

// Middleware to handle file upload errors
function handleUploadError(error, req, res, next) {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            req.flash('error', 'Bestand is te groot. Maximum bestandsgrootte is 10MB.');
        } else if (error.code === 'LIMIT_FILE_COUNT') {
            req.flash('error', 'Te veel bestanden. Maximum 5 bestanden tegelijk.');
        } else {
            req.flash('error', 'Fout bij uploaden: ' + error.message);
        }
    } else if (error) {
        req.flash('error', error.message || 'Onbekende fout bij uploaden.');
    }
    
    res.redirect(req.get('Referrer') || '/');
}

// Get file type icon
function getFileIcon(mimetype) {
    if (mimetype.includes('pdf')) return 'fas fa-file-pdf text-danger';
    if (mimetype.includes('word')) return 'fas fa-file-word text-primary';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'fas fa-file-excel text-success';
    if (mimetype.includes('image')) return 'fas fa-file-image text-info';
    if (mimetype.includes('text')) return 'fas fa-file-alt text-secondary';
    return 'fas fa-file text-muted';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
    upload,
    uploadToCloudinaryFromFile,
    deleteFromCloudinaryByPublicId,
    getCloudinaryFileMetadata,
    generateCloudinaryDownloadUrl,
    handleUploadError,
    getFileIcon,
    formatFileSize
};