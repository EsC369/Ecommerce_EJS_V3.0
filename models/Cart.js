const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema:
const CartSchema = new Schema({
    products: [
        {
            // Extra info for order purchasing:
            total: {
                type: Number, 
                required: true
            },

            desiredQuantity: {
                type: Number, 
                required: true
            },

            // Item Object Info ---
            _id: {
                type: String,
                required: true
            },

            name: {
                type: String
            },
            
            quantity: {
                type:  Number
            },

            price: {
                type: Number
            },

            image: {
                type: String,
                required: true,
                minlength: [2, 'Category must include an image,']
            },

            description: {
                type: String,
                required: true,
                minlength: [3, 'Product must include a description.']
            },

            qtySold: {
                type:  Number
            },
            
            date: {
                type: Date, 
                default: Date.now
            }
        }
    ],
    
});

module.exports = Cart = mongoose.model("carts", CartSchema);