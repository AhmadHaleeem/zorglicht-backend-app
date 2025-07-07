const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    naam: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    beschrijving: {
        type: String,
        required: true,
        trim: true
    },
    machtigingen: [{
        type: String,
        enum: ['create', 'read', 'update', 'delete', 'admin', 'team_management', 'code_access'],
        required: true
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for better query performance
roleSchema.index({ isActive: 1 });

module.exports = mongoose.model('Role', roleSchema);