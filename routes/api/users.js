// Library Imports:
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
// const config = require("config");
// var db = config.get('mongoURI');
const mongoose = require("mongoose");
const path = require("path");
const nodemailer = require("nodemailer");
const ObjectId = require('mongodb').ObjectID;
const LocalStorage = require('node-localstorage').LocalStorage;
const dotenv = require('dotenv').config();

// User Model:
const User = require("../../models/User");

// Variables:
const maxSize = 1 * 1024 * 1024; // for 1MB 
var desiredSaves = [];

// All Variables below here are for utilizing facebook login, CUrrently not being used/commented out:
const webpush = require("web-push")
const passport = require("passport");
const strategy = require("passport-facebook")

//REGEX:
const regexThree = /^\d{5}(?:[-\s]\d{4})?$/
const regexTwoPhone = /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/
const regexFourPhone = /^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/
const regexFivePhone = /^(\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/
const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
const emailREGEX = new RegExp(regex)
const phoneREGEX = new RegExp(regexFivePhone)
const zipREGEX = new RegExp(regexThree)

// Standalone Functions----------------------------:
var randCred = 0; // Declare Global empty credit for use with other functions:
function genCredits(){
  // Resetting Credits:
  randCred = 0;
  // Generate random number between 5 and 12:
  number = Math.floor(Math.random() * (12 - 5 + 1) + 5);
  // Push Random Num to Global Var For usage with other functions:
  randCred += number;
  console.log("RandCred after: ", randCred);
  return randCred;
}

// Image Uploading Middlewares:
// Set The Storage Engine
const multer = require('multer');
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init Upload
// Set your file size limit
const upload = multer({
  storage: storage,
  limits:{fileSize: maxSize},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
    }
}).single('myImage');

// Check File Type
function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Images Only!');
  }
}

// ROUTES ---------------------------------------------

// @route GET /api/users/
// @desc  Renders The Index/Login Reg Page
router.get("/", function (req, res) {
  res.render("index");
});

// @route GET /blog
// @desc  Renders The Index/Login Reg Page
router.get("/blog-page", function (req, res) {
  res.render("blog");
});

// @route GET /products
// @desc  Renders Products 
router.get("/products", function (req, res) {
  res.render("products");
});

// @route GET /single-product
// @desc  Renders A Single Product
router.get("/single-product", function (req, res) {
  res.render("single-products");
});

// @route GET /
// @desc  Renders The Profile Page *NOTE* Not being used anymore
router.get("/profile", function (req, res) {
  res.render("success");
});

// @route GET /payment
// @desc  Renders The Payment Page
router.get("/payment-page", function (req, res) {
  res.render("payment");
});

// @route GET /register-page
// @desc  Renders The Register Page
router.get('/register-page', (req, res) => {
  res.render('register');
});

// @route GET /login-page
// @desc  Renders The Login Page
router.get('/login-page', (req, res) => {
  res.render('login');
});

 // @route GET /about-page
// @desc  Renders The About Page
router.get('/about-page', (req, res) => {
  res.render('about');
});

 // @route GET /contact-page
// @desc  Renders The Contact Page
router.get('/contact-page', (req, res) => {
  res.render('contact');
});


 // @route GET /cart
// @desc  Renders TCart Example
router.get('/cart-page', (req, res) => {
  res.render('cart');
});

// @route POST /upload
// @desc  Uploads image to server/local-storage
router.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if(err){
      // Validaition for certain image limitations: Size, And Images ONLY:
      if(err.code === "LIMIT_FILE_SIZE"){
        console.log("Image to big!")
        req.flash("error", "Image Size To Big! 1 MB Maximum!");
        res.redirect('/edit-profile');
        }else{
        console.log("Images Only!", err)
        req.flash("error", "Images Only!");
        res.redirect('/edit-profile');
        }
      }else if(req.file == undefined){
        console.log("hitting here under undefined")
        req.flash("error", "No File Selected!");
        res.redirect('/edit-profile');
      }else{
        // Check if user is loging in, if not re-route to root:
        if (req.session.user_id) {
          // Query by ID:
          User.findOne({ _id: new ObjectId(req.session.user_id) }, function (err, user) {
            if (err) {
              req.flash("error", "Must be logged in!")
              res.redirect("/");
            }
            else {
              // Destructuring, pulling data from req.body:
              const { name, zipcode, nickname, premium_credits} = user
              // Creating new object with updated user fields:
              const updatedUser = {
                name,
                zipcode,
                nickname,
                premium_credits,
                img: `uploads/${req.file.filename}` // Declaring path to uploaded image:
              }

              console.log("Updated User Image: ", updatedUser);
              // Overriding push to Mongo db, overwritting currnt data and replacing with new updated object:
              User.updateOne({ "_id": new ObjectId(req.session.user_id)}, {$set: updatedUser}, (error, result) => {
                if(error) {
                    // return res.status(500).send(error);
                    console.log("Failed to upload image... Error: ", error)
                    req.flash("error", "Failed to upload image"); // FLash error:
                    return res.redirect("/edit-profile") // Redirect Edit Profile
                }
                console.log("Successfully Updated!")
                // Render Profile page with updated User Info:
                return res.render("profile",  {user:updatedUser, msg: "Image Successfully Updated!" });
            });
            }
          });
        }
      }
  });
});

// @route GET /profile
// @desc  Renders The Profile Page
router.get('/profile-page', (req, res) => {
  if (req.session.user_id) {
    // Query DB for User by ID:
    User.findOne({ _id: req.session.user_id }, function (err, user) {
      if (err) { // If not found, User not logged in:
        req.flash("error", "Must be logged in!") // Flash Error msg
        res.redirect("/login-page"); // Redirect Login page
      }
      else { // Else User Found, Render Profile page with user data:
        res.render("profile", { user: user });
      }
    });
  }
  else { // else User IS NOT logged in or registered, reroute to root:
    req.flash("error", "Must be logged in!") // Flash error
    res.redirect("/login-page"); // Redirect to Login page
  }
});

// @route GET /edit-profile
// @desc  Renders The Edit profile Page
router.get('/edit-profile', (req, res) => {
  if (req.session.user_id) {
    // Query DB For User by ID for current data:
    User.findOne({ _id: req.session.user_id }, function (err, user) {
      if (err) {
        req.flash("error", "Must be logged in!") // Flash error
        res.redirect("/login-page");
      }
      else {
        // Render Edit Profile page while sending current User Data:
        res.render("edit-profile", { user: user, msg: "Edit YOUR Profile!" });
      }
    });
  }
  else { // else User isnt loggedin or registered:
    req.flash("error", "Must be logged in!")
    res.redirect("/login-page");
  }
});

// @route POST /update-profile
// @desc  Form To Add Extended User Info
router.post("/update-profile", (req, res) => {
  if (req.session.user_id) {
    User.findOne({ _id: new ObjectId(req.session.user_id) }, function (err, user) {
      if (err) {
        req.flash("error", "Must be logged in!")
        res.redirect("/login-page");
      }
      else {
        // Destructuring, pulling data from the querried User data:
        const { email,  phone, img, premium_credits} = user
        // Destructuring, pulling data from the req.body(FORM):
        const { name, zipcode, nickname } = req.body
        // Creating user object for failed update:
        const oldData = {
          email, phone, img, premium_credits
        }
        // Create new object with updated User Fields:
        const updatedUser = {
          name,
          email,
          zipcode,
          nickname,
          phone,
          premium_credits,
          img
        }
        // Simple Validations: NOTE All validations and inputs for nearly every user Field, commented out as it wasnt needed. I left incase we may want to change that
        if(!name || name === ""){
          console.log("Name Blank")
          req.flash("error", "Please Enter Your Name!");
          res.redirect("/edit-profile");
        }
        else if(!nickname || nickname === ""){
          console.log("Nickname Blank")
          req.flash("error", "Please Enter your Nickname!");
          res.redirect("/edit-profile");
        // }else if(!country || country === "default"){
        //   console.log("Country Blank")
        //   req.flash("error", "Your Country Must Be Selected!");
        //   res.redirect("/edit-profile");
        // }else if(!gender || gender === "default"){
        //   console.log("Gender Blank");
        //   req.flash("error", "Your Gender Must Be Selected!");
        //   res.redirect("/edit-profile");
        }else if(!zipcode || zipcode === ""){
          console.log("zipcode Blank")
          req.flash("error", "Please Enter your Zipcode!");
          res.redirect("/edit-profile");
        }else if(!zipREGEX.test(zipcode)) {
            console.log("Zipcode Is Invalid")
            req.flash("error", "Please Enter A Valid Zipcode")
            res.redirect("/edit-profile");
          }else{
          console.log("Updated User Info: ", updatedUser);
          // Override current User data with new Object:
          User.updateOne({ "_id": new ObjectId(req.session.user_id)}, {$set: updatedUser}, (error, result) => {
            if(!result) { // If the result failed, then flash error and re-route to Profile page:
                console.log("Failed to update Profile Info.")
                req.flash("error", "Failed To Update Profile Info");
                return res.render("profile",  {user:oldData, msg: "Profile Unfortunately Failed To Update" });
            }
            console.log("Successfully Updated!")
            return res.render("profile",  {user:updatedUser, msg: "Profile Successfully Updated! THANK YOU!" });
          });
        }
      }
    });
  }
});


// NOTE HERE! LEFT OFF ON LOGIN HERE!
// @route  POST /login
// @desc  For Logging In A User
router.post('/login', (req, res) => {
  console.log("hitting here login");
  // console.log("TEST REQ BODY: "+ req.body.emailLog);
  const { emailLog, passwordLog } = req.body;
  const emailLower = emailLog.toLowerCase();
  console.log("CURRENT GRAB OF DATA EMAIL: "+ emailLower);
  console.log("CURRENT GRAB OF DATA PASS: "+ passwordLog);

  // Simple validation:
  if (!emailLog || !passwordLog) {
    console.log("Please Enter All Login Fields!")
    req.flash("error", "Please Enter All Login Fields")
    res.redirect("/login-page");
  }
  // else if(!emailREGEX.test(emailLog)){
  //   console.log("Invalid Email")
  //   req.flash("error", "Please Enter A Valid Email")
  //   res.redirect("/login-page");a
  // }
  else {
    // Query DB For User By Specified Email:
    User.findOne({ email: emailLower }, function (err, user) {
      if (err) {
        req.flash("error", "User Doesnt Exists");
        res.redirect("/login-page");
      }
      else {
        if (user) { // User was found
          console.log("found user with email " + user.email);
          // Comparing Password with stored hash vs user input:
          bcrypt.compare(passwordLog, user.password, function (err, result) {
            if (result) { // If Password is a match, then throw user ID into session and route to profile page:
              console.log("HITTING HERE! ");
              req.session.user_id = user._id; // Throwing ID into session:
              res.render("profile", {user: user, msg: "Successfully Logged in! Welcome Back!"});
              console.log("HITTING HERE! 2 ");
            }
            else { // Else passwords did not match with stored hash:
              console.log("Wrong Password!");
              req.flash("error", "Wrong Password!");
              res.redirect("/login-page");  
            }
          });
        }
        else { // User not found
          console.log("User Not Found!");
          req.flash("error", "User Not found");
          res.redirect("/login-page");
        }
      }
    })
  }
});

// @route GET /success
// @desc  The TypeCast Official Logged In Home Page - *NOTE* Old, No longer being used but left it here for now:
router.get("/success", function (req, res) {
  if (req.session.user_id) {
    User.findOne({ _id: req.session.user_id }, function (err, user) {
      if (err) {
        req.flash("error", "Must be logged in!")
        res.redirect("/");
      }
      else {
        res.render("profile", { user: user });
      }
    });
  }
  else {
    req.flash("error", "Must be logged in!")
    res.redirect("/");
  }
});

// @route POST /logout
// @desc  Logout A User
router.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/")
});

// @route POST /register
// @desc  Registers A New User
router.post("/register", (req, res) => {
  // Destructuring, Pulling the values out from request.body
  const { userName, emailLog, passwordLog, password2, phone, zipcode, nickname, gender, country } = req.body;
  let lowerEmail = emailLog.toLowerCase();
  // if(emailLog != undefined){
  //   let lowerEmail = emailLog.toLowerCase(); 
  //   console.log("TEST RESULT lowerEmail: "+ lowerEmail);
  // }else{
  //   let lowerEmail = "";
  //   console.log("TEST RESULT lowerEmail: "+ lowerEmail);
  // } // setting email input to lowercase to deture mismatches due to being case sensative:
  
  // console.log("email lower case", lowerEmail);
  console.log("Data being grabbed is :", req.body);
  // Basic Validation: -------- NOTE Some fields are commented out in case we end up wanting them:
  // if(!phone || phone === ""){
  //   console.log("Phone Is blank")
  //   req.flash("error", "Please Enter A Phone Number")
  //   res.redirect("/register-page");
  // }
  // else if(/^\d+$/.test(phone)){
  //   console.log("Phone number is all digits. Running check for proper length")
  //   if(phone.length < 10 || phone.length > 10) {
  //     console.log("Phone number is less or more than 10!")
  //     // req.flash("error", "Please Enter A Valid Phone Number")
  //     // res.redirect("/register-page");
  //   }
  // }
  // else if(!phoneREGEX.test(phone)) {
  //   console.log("Phone Is Invalid")
  //   req.flash("error", "Please Enter A Valid Phone Number")
  //   res.redirect("/register-page");
  // }
  // else if(!zipcode || zipcode === ""){
  //   console.log("Zip Is blank")
  //   req.flash("error", "Please Enter Zipcode")
  //   res.redirect("/register-page");
  // }
  // else if(!zipREGEX.test(zipcode)) {
  //   console.log("Phone Is Invalid")
  //   req.flash("error", "Please Enter A Valid Zipcode")
  //   res.redirect("/register-page");
  // }
  // else if(!nickname || nickname === ""){
  //   console.log("Nickname Is blank")
  //   req.flash("error", "Please Enter A Nickname")
  //   res.redirect("/register-page");
  // }
  if(!userName || userName === ""){
    console.log("Name Is blank")
    req.flash("error", "Please Enter A Name")
    res.redirect("/register-page");
  }
  else if(!emailLog || emailLog === ""){
    console.log("email Is blank")
    req.flash("error", "Please Enter An Email")
    res.redirect("/register-page");
  }
  else if(!emailREGEX.test(emailLog)){
    console.log("Invalid Email")
    req.flash("error", "Please Enter A Valid Email")
    res.redirect("/register-page");
  }
  // else if(!gender || gender === "" || gender === "default"){
  //   console.log("Gender Is blank")
  //   req.flash("error", "Please Enter A Gender")
  //   res.redirect("/register-page");
  // }
  else if(!passwordLog || passwordLog === ""){

    console.log("Password Is blank");
    req.flash("error", "Please Enter A Password");
    res.redirect("/register-page");
  // }else if(password != password2){
  //   console.log("Passwords DO NOt match!")
  //   req.flash("error", "Passwords Do not Match!")
  //   res.redirect("/register-page");
  // }else{
    }else{
    // ENd of validation ------------
    // Check for existing user:
    User.findOne({ email: emailLog })
      .then(user => {
        if (user) {
          console.log("User Already Exists!")
          req.flash("error", "User Already Exists!")
          return res.redirect("/");
        }
        // Credits function:
        credits = genCredits();

        // Create new User With generated Premium credits and declaring default photo path for img:
        // const newUser = new User({
        //   name: userName,
        //   email: lowerEmail,
        //   zipcode,
        //   nickname,
        //   phone,
        //   gender,
        //   country,
        //   password: passwordLog,
        //   premium_credits: credits,
        //   img: "../uploads/default-photo.jpg"
        // })
        const newUser = new User({
          name: userName,
          email: lowerEmail,
          password: passwordLog
        })
        // Create salt and hashed password utilizing bcrypt:
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err
            newUser.password = hash;
            console.log("HASHED Password", hash);
            newUser.save((err) => { // Save new User into DB:
              if (err) { // If error:
                console.log("User Already Exists!")
                req.flash("error", "User Already Exists")
                return res.redirect("/");
              }
            })
            console.log("success")
            // Add ID Into Session:
            req.session.user_id = newUser._id;
            // Send Email Function with nodemailer:
            // sendEmail(email, name) HERE! MOTE! SENDING EMAIL CALL! :
            // Render Profile page with New user info:
            res.render("profile", {user: newUser, msg: 'Account Created! Please Check Your Email!'});
            
          });
        });
      });
  }
});

//  FUNCTION TO SEND EMAIL TO NEW USER!  - CURRENTLY BREAKING AND/OR GETTING HUND! :D
// Helper function to send email to users:
// function sendEmail(email, name){
//   console.log(`Sending Email To ${email}...`)
//   let transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 465,
//     secure: true, // true for 465, false for other ports
//     auth: {
//       user: proccess.env.TEST_NAME, // generated ethereal user
//       pass: proccess.env.TEST, // generated ethereal password
//     },
//   });
//   // try{
      
//       // Email template inline css for sending html through email: Commented out for now as not desired:
//     // const output = `<table cellspacing="0" cellpadding="0" border="0" style="color:#333;background:#fff;padding:0;margin:0;width:100%;font:15px/1.25em 'Helvetica Neue',Arial,Helvetica"> <tbody><tr width="100%"> <td valign="top" align="left" style="background:#eef0f1;font:15px/1.25em 'Helvetica Neue',Arial,Helvetica"> <table style="border:none;padding:0 18px;margin:50px auto;width:500px"> <tbody> <tr width="100%" height="60"> <td valign="top" align="left" style="border-top-left-radius:4px;border-top-right-radius:4px;background:#27709b url("/images/typecast-logo-solo.png" title="Trello" style="font-weight:bold;font-size:18px;color:#fff;vertical-align:top" class="CToWUd"> </td> </tr> <tr width="100%"> <td valign="top" align="left" style="background:#fff;padding:18px">

//     // <h1 style="font-size:20px;margin:16px 0;color:#333;text-align:center"> Let's collaborate! </h1>
    
//     // <p style="font:15px/1.25em 'Helvetica Neue',Arial,Helvetica;color:#333;text-align:center"> You are invited to the About TypeCast.Life! Group: </p>
//     // <p style="font:15px/1.25em 'Helvetica Neue',Arial,Helvetica;color:#333;text-align:center"> Thank you for registering! Your typecasting awaits! </p>
    
//     // <div style="background:#f6f7f8;border-radius:3px"> <br>
    
//     // <p style="text-align:center"> <a href="#" style="color:#306f9c;font:26px/1.25em 'Helvetica Neue',Arial,Helvetica;text-decoration:none;font-weight:bold" target="_blank">Typecast.Life</a> </p>
    
//     // <p style="font:15px/1.25em 'Helvetica Neue',Arial,Helvetica;margin-bottom:0;text-align:center"> <a href="#" style="border-radius:3px;background:#3aa54c;color:#fff;display:block;font-weight:700;font-size:16px;line-height:1.25em;margin:24px auto 6px;padding:10px 18px;text-decoration:none;width:180px" target="_blank"> See the organization</a> </p>
    
//     // <br><br> </div>
    
//     // <p style="font:14px/1.25em 'Helvetica Neue',Arial,Helvetica;color:#333"> <strong>What's Typecast?</strong> It's the easiest way to find out what others perceive of you! <a href="https://type-cast.herokuapp.com/about-page" style="color:#306f9c;text-decoration:none;font-weight:bold" target="_blank">Learn more »</a> </p>
    
//     // </td>
    
//     // </tr>
    
//     // </tbody> </table> </td> </tr></tbody> </table>`;

//     var output = `Welcome to TypeCast.Life, ${name}!

//     Let's get started! Head to https://www.typecast.life and update your profile. Once that's out of the way, feel free to select a few sample questions as a challenge to other users. It will be fun!
    
//     As a reward for pre-registering on the site before the launch, you have been awarded ${randCred} credits towards Premium membership. Check back often to discover new ways to earn more credits!
    
//     Coming Soon:  Verify Your Email By Clicking The Link: 5965785dadefe410f946cdb37b74ab6a

//     Sincerely,
//     The TypeCast.Life team
    
//     P.S. This is automated email. Please do not reply to this message`;

//     var mailOptions = {
//       from: '"TypeCast.Life!" <no-Reply@gmail.com>', // sender address
//       to: `${email}`, // list of receivers
//       subject: "Hello ✔ WELCOME TO TYPECAST.LIFE!",
//       text: output
//   };

//   // Send email and handle response:
//   transporter.sendMail(mailOptions, function(error, info){
//   if(error){
//       console.log("error:", error)
//   }else{
//       console.log('Message sent: ' + info.response);
//   };
//   });  
// };

// END HERE OF EMAIL SENDER!:

//----------------- FACEBOOK LOGIN ----------------
// facebook login Left off On reversing user info for input and output
// router.post("/facebook", (req, res) => {
//   res.redirect("/auth/facebook");
// })

// router.get("/facebook-email", (req, res) => {
//   res.render("fb-email");
// })

// // @route POST /facebook-login
// // @desc  Login With Facebook API
// router.post("/facebook-login", (req, res) => {
//   const { emailFB, emailFB2 } = req.body;

//   if(!emailFB || emailFB === ""){
//     console.log("Blank Email")
//     req.flash("error", "For FB Login, We Only Require Your Email...");
//     res.redirect("/register-page");
//   }else if(!emailREGEX.test(emailFB)){
//     console.log("Invalid Email")
//     req.flash("error", "Please Enter A Valid Email");
//     res.redirect("/facebook-email");
//   }else if(emailFB !== emailFB2){
//     console.log("Email Mismatch")
//     req.flash("error", "Emails Didn't Match!");
//     res.redirect("/facebook-email");
//   }else{
//     let lowerEmail = emailFB.toLowerCase()
//     console.log("email lower case", lowerEmail)

//     console.log("Desired Saves So far: ", desiredSaves)
//     let name = desiredSaves[0].firstName + " " + desiredSaves[0].lastName;
//     let fb_id = desiredSaves[0].fb_id;
//     // console.log("name, email, fb_id: ", name, email, fb_id)
//     // Check for existing user:
//     User.findOne({ email: lowerEmail })
//     .then(user => {
//       if (user) {
//         console.log("User Already Exists!")
//         req.flash("error", "User Already Exists!")
//         return res.redirect("/");
//       }
//       const newUser = new User({
//         name,
//         premium: true,
//         email: lowerEmail,
//         fb_login: true,
//         fb_id:  fb_id,
//         img: "../uploads/default-photo.jpg"
//       })

//       console.log("TEST HERE FACEBOOK LOGIN NEW USER CREATION: ", newUser)
//       newUser.save((err) => {
//         if (err) {
//           console.log("User Already Exists!")
//           req.flash("error", "User Already Exists")
//           return res.redirect("/");
//         }
//       });
//           console.log("success")
//           // Add Into Session:
//           req.session.user_id = newUser._id;
//           sendEmail(lowerEmail, name)
//           res.render("profile", {user: newUser, msg: 'Account Created! Please Check Your Email!'}); 
//     });
//   }
// });

// const FacebookStrategy = strategy.Strategy;

// dotenv.config();
// passport.serializeUser(function(user, done) {
//   done(null, user);
// });

// passport.deserializeUser(function(obj, done) {
//   done(null, obj);
// });

// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: process.env.FACEBOOK_CLIENT_ID,
//       clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
//       callbackURL: process.env.FACEBOOK_CALLBACK_URL,
//       profileFields: ["email", "name"]
//     },
//     function(accessToken, refreshToken, profile, done) {
//       const { id, first_name, last_name } = profile._json;
//       const userData = {
//         fb_id: id,
//         firstName: first_name,
//         lastName: last_name
//       };
//       desiredSaves.length = 0;
//       console.log("Desired Saves Array Should Be Empty: ", desiredSaves)
//       desiredSaves.push(userData);
//       console.log("New Desired Saves: facebook User data: ", desiredSaves)
//       done(null, profile);
//     }));

// router.get("/auth/facebook", passport.authenticate("facebook"));

// router.get(
//   "/auth/facebook/callback",
//   passport.authenticate("facebook", {
//     successRedirect: "/fb-email",
//     failureRedirect: "/fail"
//   })
// );

// router.get("/fail", (req, res) => {
//   // res.send("Failed attempt");
//   console.log("Failed To Login With facebook")
//   req.flash("error", "Failed To Login With Facebook!")
//   req.redirect("/register-page")
// });

// router.get("/fb-email", (req, res) => {
//   console.log("FB-login Successful, requesting email from user...")
//   res.render("fb-email")
// });
// End of Facebook Routes: //--------------------

// Export All routes To Server:
module.exports = router;