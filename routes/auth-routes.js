const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const config = require('../config');

const router = express.Router();

const JWT_SECRET = config.JWT_SECRET;

console.log(JWT_SECRET);


// Register User
router.post('/register', async (req, res) => {
    try {
        const body = req.body
        // console.log('register body', body);
        const { userName, password, name } = body;
        const user = new User({ userName, password, name });
        await user.save();
        const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, JWT_SECRET);
        res.status(201).json({ message: 'User registered', token, _id: user._id, userName: user.userName, name: user.name });
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
        res.json({ message: 'Login successful', token, _id: user._id, userName: user.userName, name: user.name });
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
            return res.status(409).json({ available: false, message: 'Username is already taken' });
        }

        res.status(200).json({ available: true, message: 'Username is available' });
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

module.exports = router;