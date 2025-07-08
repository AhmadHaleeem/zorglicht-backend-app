const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
    naam: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    telefoon: {
        type: String,
        trim: true
    },
    functie: {
        type: String,
        required: true,
        trim: true
    },
    rol: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },
    startdatum: {
        type: Date,
        default: Date.now
    },
    salaris: {
        type: Number,
        min: 0
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving
employeeSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
employeeSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Transform output
employeeSchema.methods.toJSON = function() {
    const employee = this.toObject();
    delete employee.password;
    return employee;
};

module.exports = mongoose.model('Employee', employeeSchema);