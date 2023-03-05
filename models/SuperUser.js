const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema:
const SuperUserSchema = new Schema({
    name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    
    img: { 
        type: String
    },
    
    password: {
        type: String
    },
    isTheOne: {
        type: Boolean,
        default: false
    },
    register_date: {
        type: Date,
        default: Date.now
    }
});

module.exports = SuperUser = mongoose.model("superuser", SuperUserSchema);