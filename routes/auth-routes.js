const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const config = require('../config');

const router = express.Router();

const JWT_SECRET = config.JWT_SECRET;

// Register User
router.post('/register', async (req, res) => {
    try {
        const body = req.body
        // console.log('register body', body);
        const { userName, password, name, profilePicture } = body;
        const user = new User({ userName, password, name, profilePicture });
        await user.save();
        const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, JWT_SECRET);
        const userWithoutPassword = { ...user._doc };
        delete userWithoutPassword.password;
        res.status(201).json({ token, user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message }); // Handle errors
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { userName, password } = req.body;
        const user = await User.findOne({ userName });
        if (!user || !(await bcrypt.compare(password, user.password))) { // check if match password
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, JWT_SECRET);
        const userWithoutPassword = { ...user._doc };
        delete userWithoutPassword.password;
        res.status(200).json({ token, user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message }); // Handle errors
    }
});

// Check if username is available
router.get('/check-username', async (req, res) => {
    try {
        const { userName } = req.query; // Get username from query params
        if (!userName) {
            return res.status(400).json({ message: 'userName is required as params' });
        }

        // Check if the username already exists
        const existingUser = await User.findOne({ userName });

        if (existingUser) {
            return res.status(200).json({ available: false, message: 'Username is already taken' });
        }

        res.status(200).json({ available: true, message: 'Username is available' });
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

// get user
router.get('/user', async (req, res) => {
    try {
        const userFronJwtSecret = req.userFronJwtSecret;
        const userId = userFronJwtSecret?.userId;
        const user = await User.findById(userId).select('-password -__v'); // Get user details except password
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

// edit user
router.patch('/user', async (req, res) => {
    try {
        const userFronJwtSecret = req.userFronJwtSecret;
        const userId = userFronJwtSecret?.userId;

        const user = await User.findByIdAndUpdate( // Only update allowed fields
            userId,
            { $set: req.body },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, JWT_SECRET);
        res.status(200).json({ token, user });
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

// Change password
router.patch('/change-password', async (req, res) => {
    try {
        const userFronJwtSecret = req.userFronJwtSecret;
        const userId = userFronJwtSecret?.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

module.exports = router;