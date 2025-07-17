const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    naam: {
        type: String,
        required: true,
        trim: true
    },
    originalName: {
        type: String,
        required: true,
        trim: true
    },
    eigenaar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    uploadDatum: {
        type: Date,
        default: Date.now
    },
    grootte: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    resourceType: {
        type: String,
        required: false
    },
    cloudinaryPublicId: {
        type: String,
        required: true
    },
    cloudinaryUrl: {
        type: String,
        required: true
    },
    downloadUrl: {
        type: String,
        required: true
    },
    folder: {
        type: String,
        default: 'documents'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for better query performance
fileSchema.index({ eigenaar: 1, uploadDatum: -1 });
fileSchema.index({ cloudinaryPublicId: 1 });

module.exports = mongoose.model('File', fileSchema);