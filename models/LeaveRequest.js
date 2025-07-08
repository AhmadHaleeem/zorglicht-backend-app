const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['in behandeling', 'goedgekeurd', 'afgewezen'],
        default: 'in behandeling'
    },
    adminResponse: {
        type: String,
        trim: true,
        maxlength: 500
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    reviewedAt: {
        type: Date
    },
    totalDays: {
        type: Number
    }
}, {
    timestamps: true
});

// Calculate total days before saving
leaveRequestSchema.pre('save', function(next) {
    if (this.startDate && this.endDate) {
        const timeDiff = this.endDate.getTime() - this.startDate.getTime();
        this.totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
    }
    next();
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);