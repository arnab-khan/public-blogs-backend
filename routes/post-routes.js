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

// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().populate('author', '-password -__v'); // Get posts with author (user) details except password
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

// Get All Posts for a Particular User
router.get('/user/:userId', async (req, res) => {
    try {
        const posts = await Post.find({ author: req.params.userId }).populate('author', '-password -__v'); // Get posts with author (user) details except password
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

// Edit a Post
router.patch('/:postId', async (req, res) => {
    try {
        const { title, content } = req.body;
        const userFronJwtSecret = req.userFronJwtSecret;
        const userId = userFronJwtSecret?.userId;
        const post = await Post.findById(req.params.postId).populate('author', '-password -__v'); // Get posts with author (user) details except password
        const postLinkedUserId = post.author._id.toString();
        if (userId != postLinkedUserId) {
            return res.status(404).json({ error: "Unauthorised" });
        }
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.postId, // Finds the post by its `_id`
            { // Updates only the provided fields, leaving others unchanged
                ...(title && { title }),
                ...(content && { content }),
            },
            {
                new: true, // `new: true` returns the updated document
                runValidators: true // `runValidators: true` enforces schema validation
            }
        );
        res.json({ message: 'Post updated successfully', updatedUser: updatedPost });

    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

module.exports = router;