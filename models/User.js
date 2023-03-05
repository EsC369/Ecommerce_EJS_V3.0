const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema:
const UserSchema = new Schema({
    name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    zipcode: {
        type: String
    },
    img: { 
        type: String
    },
    premium: {
        type: Boolean,
        default: true
    },
    phone: {
        type: String
    },
    nickname: {
        type: String
    },
    gender: {
        type: String
    },
    password: {
        type: String
    },
    country: {
        type: String
    },
    fb_login: {
        type: Boolean,
        default: false
    },
    fb_id: {
        type: String
    },
    premium_credits: {
        type: Number
    },
    premium_date: {
        type: Date,
        default: Date.now
    },
    register_date: {
        type: Date,
        default: Date.now
    },
});

module.exports = User = mongoose.model("user", UserSchema);