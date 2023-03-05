const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema:
const ItemSchema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: [3, 'Product must be at least 3 characters long.']
    },
    description: {
        type: String,
        required: true,
        minlength: [3, 'Product must include a description.']
    },
    price: {
        type: Number,
        required: true,
        minlength: [3, 'Product must have a price.'],
        match: /^\d+(,\d{3})*(\.\d{1,2})?$/
    },
    quantity: {
        type: Number,
        required: true,
        minlength: [1, 'Product must be atleast 1.'],
    },
    image: {
        type: String,
        minlength: [2, 'Category must include an image,']
    },
    qtySold: {
        type: Number,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = Item = mongoose.model("item", ItemSchema);