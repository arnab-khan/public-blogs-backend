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
        console.log('register body', body);
        const { userName, password } = body;
        const user = new User({ userName, password });
        console.log('user', user);

        await user.save();
        res.status(201).json({ message: 'User registered' });
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
        res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message }); // Handle errors
    }
});

module.exports = router;