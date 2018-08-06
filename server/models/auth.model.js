'use strict';
const mongoose = require('mongoose');

const UserModel = function() {
    const userSchema = mongoose.Schema({
        Email : String,
        Password : String,
    });
    return mongoose.model('RegisteredUsers', userSchema);
};

module.exports = new UserModel ();
