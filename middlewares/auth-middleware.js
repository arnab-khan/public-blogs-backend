const jwt = require('jsonwebtoken');
const config = require('../config');
const JWT_SECRET = config.JWT_SECRET;

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // if (!authHeader) {
    //     return res.status(403).json({ message: "Access denied. No token provided." });
    // }

    const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>" format

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log('Invalid or expired token.');
            
            // return res.status(403).json({ message: "Invalid or expired token." });
        }

        req.userFronJwtSecret = decoded; // Attach user data to request
        next(); // Proceed to next middleware or route
    });
};

module.exports = authMiddleware;
