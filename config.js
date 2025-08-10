const crypto = require('crypto'); // Import the built-in crypto module for cryptographic functions
const JWT_SECRET = process.env?.JWT_SECRET || crypto.randomBytes(32).toString('hex'); // Use JWT_SECRET from environment variables if available // Otherwise, generate a new 32-byte random secret and convert it to hex
module.exports = {
    JWT_SECRET
};
