const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const User = require('../models/user');

// Create a new post
router.post('/create', async (req, res) => {
    try {
        const { title, content } = req.body;
        const userFronJwtSecret = req.userFronJwtSecret;
        const userId = userFronJwtSecret.userId;
        
        // Check if the provided `authorId` exists in the User collection
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Create a new post
        const post = new Post({
            title,
            content,
            author: userId // Store reference to User ID
        });

        // Save to database
        await post.save();
        res.status(201).json({ message: "Post created successfully", post });
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

module.exports = router;