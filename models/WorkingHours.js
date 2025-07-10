const mongoose = require('mongoose');

const workingHoursSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Start time must be in HH:MM format'
        }
    },
    endTime: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'End time must be in HH:MM format'
        }
    },
    breakDuration: {
        type: Number,
        default: 0,
        min: 0,
        max: 480 // Maximum 8 hours break
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    project: {
        type: String,
        trim: true,
        maxlength: 100
    },
    status: {
        type: String,
        enum: ['in behandeling', 'goedgekeurd', 'afgewezen'],
        default: 'in behandeling'
    },
    totalHours: {
        type: Number
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
    }
}, {
    timestamps: true
});

// Calculate total hours before saving
workingHoursSchema.pre('save', function(next) {
    if (this.startTime && this.endTime) {
        const [startHour, startMin] = this.startTime.split(':').map(Number);
        const [endHour, endMin] = this.endTime.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        let totalMinutes = endMinutes - startMinutes;
        
        // Handle overnight shifts
        if (totalMinutes < 0) {
            totalMinutes += 24 * 60;
        }
        
        // Subtract break duration
        totalMinutes -= this.breakDuration;
        
        // Convert to hours with 2 decimal places
        this.totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    }
    next();
});

// Compound index for employee and date to prevent duplicate entries
workingHoursSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('WorkingHours', workingHoursSchema);