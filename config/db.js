const express = require("express");
const app = express();
const mongoose = require("mongoose");

// Initialize Middelware for Mongo Options:
mongoose.set('useNewUrlParser',true);
mongoose.set('useCreateIndex',true);
mongoose.set('strictQuery', true);
mongoose.set('useNewUrlParser', true);
mongoose.set("useUnifiedTopology",  true);

// Push Connection To Database:
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Mongo DB CONNECTED!: ${conn.connection.host}`.cyan.underline);
    }catch (error) {
        console.log(error);
        process.exit(1);
    }
}

module.exports = connectDB;