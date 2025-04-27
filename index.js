const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth-routes');
const postRoutes = require('./routes/post-routes');
const authMiddleware = require('./middlewares/auth-middleware');
const cors = require('cors');
const app = express();

const allowedOrigins = [
    'https://public-blogs.arnabkhan.in',
];
app.use(cors({
    origin: function (origin, callback) {
        // Allow no origin (like curl or Postman)
        if (!origin) return callback(null, true);

        // Allow all localhost:* and public-blogs domain
        if (
            /^http:\/\/localhost:\d+$/.test(origin) ||
            allowedOrigins.includes(origin)
        ) {
            return callback(null, true);
        }

        // Otherwise, block
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true // optional, only if you're using cookies or Authorization headers
}));

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
