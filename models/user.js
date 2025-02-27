const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 50,
        match: /^[a-zA-Z\s]+$/ // Only letters and spaces allowed
    },
    userName: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 20,
        match: /^[a-zA-Z0-9]+$/ // Only letters and numbers allowed
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 20,
        match: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/ // No spaces, at least one letter and one number
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    // Hash password
    this.password = await bcrypt.hash(this.password, 10); // `10` is the salt rounds, which determines the complexity of hashing
    next();
});

module.exports = mongoose.model('User', UserSchema);