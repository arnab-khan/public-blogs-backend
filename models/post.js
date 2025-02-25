const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    // imageUrls: { type: [String], default: [] }, // Array to store multiple image URLs
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // `mongoose.Schema.Types.ObjectId` tells Mongoose that the author field will store an ObjectId (MongoDB's unique identifier). `ref: 'User'` tells Mongoose that the author field references the User collection. It creates a relationship between Post and User.
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);