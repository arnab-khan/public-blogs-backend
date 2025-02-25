const crypto = require('crypto');
const JWT_SECRET = `crypto.randomBytes(32).toString('hex');`
module.exports = {
    JWT_SECRET
};
