const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema:
const Image = new ImageSchema({ 
        img: { 
            data: Buffer, contentType: String 
        }
    });

module.exports = Image = mongoose.model("image", ImageSchema);