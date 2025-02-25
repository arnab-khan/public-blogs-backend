const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth-routes');
const postRoutes = require('./routes/post-routes');
const authMiddleware = require('./middlewares/auth-middleware');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Routes
app.use('/auth', authRoutes); // http://localhost:3000/auth/register or http://localhost:3000/auth/login
app.use('/post', postRoutes); // http://localhost:3000/post/create

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
