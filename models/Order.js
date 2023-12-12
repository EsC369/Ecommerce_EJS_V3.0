const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema:
const OrderSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },

    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    shipping_info: [
        {
            address_line_1:{
                type: String,
                required: true
            },
            address_line_2:{
                type: String
            },
            address_city: {
                type: String,
                required: true
            },
            address_state: {
                type: String,
                required: true
            },
            address_zip: {
                type: String,
                required: true
            },
            
        }
    ]
   ,
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String
    },
    orderDetails: [
        {
            _id: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            desiredQuantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            total: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            
            image: {
                type: String
            },
           
        }
    ],
    date: {
        type: Date,
        default: Date.now
    },
});

module.exports = Order = mongoose.model("orders", OrderSchema);