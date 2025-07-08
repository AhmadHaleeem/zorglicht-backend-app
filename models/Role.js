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
        required: false,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);