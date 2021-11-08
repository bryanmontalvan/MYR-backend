let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const UserSetting = {
    "darkMode": { type: Boolean, default:false }
};

const GoogleAccountSchema = new Schema({
    "email": String,
    "googleId": String,
    'userSettings':UserSetting
});

module.exports = mongoose.model('GoogleLogin', GoogleAccountSchema);
