const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const bodyParser = require("body-parser");
// const config = require("config");

const port = process.env.PORT;
const path = require("path");
const passport = require("passport");
const colors = require("colors");
const Items = require("./routes/api/items");
const Users = require("./routes/api/users");

// Modules:
const Routes = require("./routes/api/routes");
const User = require("./models/User");

// Db Config:
// const db = config.get("mongoURI");
const connectDB = require("./config/db");
// const sessionSecret = process.env.SESSION_SECRET;
connectDB();

// Passport Middleware:
app.use(passport.initialize());

// Declare paths, static and parsers middle ware:

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname + "/public")));

// Session MIDDLEWARE:
const session = require("express-session");
var sess = {
  secret: "TEMP PASS",
  cookie: { maxAge: 600000 },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sess.cookie.secure = true; // serve secure cookies
}

// Initialize session:
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 600000 }, // One hour session - will change later on.
  })
);

const flash = require("express-flash");
app.use(flash());

// Routes:
app.use("/", Routes);
// app.use("/api/users", Users);
// app.use("/api/items", Items);

// Listening
app.listen(port, () => {
  console.log(`Server Running On Port: ${port}`);
});
