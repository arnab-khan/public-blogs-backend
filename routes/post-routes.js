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
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).populate('author', '-password -__v'); // Get posts with author (user) details except password, sorted by creation date (newest first)
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
        res.json(updatedPost);

    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

// add like to a post
router.patch('/:postId/like', async (req, res) => {
    try {
        const userFronJwtSecret = req.userFronJwtSecret;
        const userId = userFronJwtSecret?.userId;
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        console.log(post.likes, userId);
        
        if (post.likes.some(like => like.user.toString() === userId)) {
            return res.status(400).json({ error: 'Already liked' });
        }
        post.likes.push({ user: userId, likedAt: new Date() });
        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

// get like list
router.get('/:postId/likes', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId).populate('likes.user', '-password -__v'); // Populate basic fields of liked users
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        res.json(post.likes);
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

module.exports = router;