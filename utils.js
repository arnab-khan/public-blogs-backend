const User = require('./models/user');
class Utils {
    user(userId) {
        return User.findById(userId).select('-password -__v'); // Get user details except password
    }
}
module.exports = Utils;