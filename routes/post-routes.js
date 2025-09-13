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
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;

        const posts = await Post.aggregate([
            {
                $lookup: { // Join with User collection to get author details. `$lookup` is used to perform a left outer join to the User collection. It adds a new array field 'author' to the output documents containing the matching documents from the User collection.
                    from: 'users', // Collection name for User
                    localField: 'author', // Field from the Post collection
                    foreignField: '_id', // Field from the User collection
                    as: 'author' // Name of the new array field to add to the output documents
                }
            },
            {
                $unwind: '$author' // In MongoDB, `$unwind` is an aggregation stage used to deconstruct an array field from the input documents into multiple output documents, one for each element of the array. Essentially, it "flattens" an array field so that each element becomes a separate document.
            },
            {
                $addFields: { // Add new fields to the documents. `$addFields` is used to add new fields to the documents in the pipeline.
                    totalComments: { $size: { $ifNull: ['$comments', []] } }, // Calculate the total number of comments. `$size` returns the size of an array. `$ifNull` is used to return an empty array if the `comments` field is null or undefined.
                    likes: { // Extract the user IDs of the likes. `$map` is used to apply a transformation to each element in an array. It creates a new array by applying the specified expression to each element of the input array.
                        $map: { // Iterate over the likes array to extract user IDs
                            input: { $ifNull: ['$likes', []] }, // If `likes` is null, use an empty array
                            as: 'like', // Name of the variable for each element in the input array
                            in: '$$like.user' // Extract the user ID from each `like` object
                        }
                    }
                }
            },
            {
                $project: { // Specify the fields to include in the output documents. 1 means include, 0 means exclude.
                    _id: 1,
                    title: 1,
                    content: 1,
                    createdAt: 1,
                    author: { _id: 1, userName: 1, name: 1, profilePicture: 1 }, // Include only specific fields from the author
                    totalComments: 1, // Include the totalComments field from $addFields stage
                    likes: 1, // Include the likes array from $addFields stage
                }
            },
            {
                $sort: { createdAt: -1 } // Sort by creation date in descending order
            },
            {
                $skip: (page - 1) * itemsPerPage
            },
            {
                $limit: itemsPerPage
            }
        ]);

        const totalPosts = await Post.countDocuments();
        const totalPages = Math.ceil(totalPosts / itemsPerPage);

        res.json({
            posts,
            pagination: {
                currentPage: page,
                totalPages,
                totalPosts,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
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

// delte a post
router.delete('/:postId', async (req, res) => {
    try {
        const userFronJwtSecret = req.userFronJwtSecret;
        const userId = userFronJwtSecret?.userId;
        const post = await Post.findById(req.params.postId);
        const postLinkedUserId = post.author.toString();
        if (userId != postLinkedUserId) {
            return res.status(404).json({ error: "Unauthorised" });
        }
        await Post.findByIdAndDelete(req.params.postId);
        res.json({ message: 'Post deleted successfully' });
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
        if (post.likes.some(like => like?.user?.toString() === userId)) { // Check if the user already liked the post            
            post.likes = post.likes.filter(like => like?.user?.toString() !== userId); // Remove the like if it exists
            await post.save();
            return res.status(200).json(post.likes);
        }
        post.likes.push({ user: userId, likedAt: new Date() }); // Add the like
        await post.save();
        res.json(post.likes);
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

// add comment to a post
router.post('/:postId/comment', async (req, res) => {
    try {
        const { content } = req.body;
        const userFronJwtSecret = req.userFronJwtSecret;
        const userId = userFronJwtSecret?.userId;
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        post.comments.push({ user: userId, content, commentedAt: new Date() }); // Add the comment
        await post.save();
        res.json(post.comments);
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

// get comment list
router.get('/:postId/comments', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId).populate('comments.user', '-password -__v'); // Populate basic fields of commented users
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        res.json(post.comments);
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

// edit comment
router.patch('/:postId/comment/:commentId', async (req, res) => {
    try {
        const { content } = req.body;
        const userFronJwtSecret = req.userFronJwtSecret;
        const userId = userFronJwtSecret?.userId;
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorised" });
        }
        comment.content = content;
        await post.save();
        res.json(post.comments);
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

// delete comment
router.delete('/:postId/comment/:commentId', async (req, res) => {
    try {
        const userFronJwtSecret = req.userFronJwtSecret;
        const userId = userFronJwtSecret?.userId;
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorised" });
        }
        comment.deleteOne();
        await post.save();
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.name, message: error.message });
    }
});

module.exports = router;