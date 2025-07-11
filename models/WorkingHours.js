const mongoose = require('mongoose');

// Time slot schema for individual time entries
const timeSlotSchema = new mongoose.Schema({
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
    }
}, { _id: false });

const workingHoursSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    timeSlots: {
        type: [timeSlotSchema],
        required: true,
        validate: {
            validator: function(v) {
                return v && v.length > 0;
            },
            message: 'At least one time slot is required'
        }
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
    if (this.timeSlots && this.timeSlots.length > 0) {
        let totalMinutes = 0;
        
        // Calculate total minutes from all time slots
        this.timeSlots.forEach(slot => {
            if (slot.startTime && slot.endTime) {
                const [startHour, startMin] = slot.startTime.split(':').map(Number);
                const [endHour, endMin] = slot.endTime.split(':').map(Number);
                
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                
                let slotMinutes = endMinutes - startMinutes;
                
                // Handle overnight shifts
                if (slotMinutes < 0) {
                    slotMinutes += 24 * 60;
                }
                
                // Subtract break duration for this slot
                slotMinutes -= (slot.breakDuration || 0);
                
                // Add to total (ensure non-negative)
                totalMinutes += Math.max(0, slotMinutes);
            }
        });
        
        // Convert to hours with 2 decimal places
        this.totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    }
    next();
});

// Index for employee to optimize queries
workingHoursSchema.index({ employee: 1 });

module.exports = mongoose.model('WorkingHours', workingHoursSchema);