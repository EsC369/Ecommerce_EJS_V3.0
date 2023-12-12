// Library Imports:
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
// const config = require("config");
// var db = config.get('mongoURI');
const mongoose = require("mongoose");
const path = require("path");
const nodemailer = require("nodemailer");
const ObjectId = require("mongodb").ObjectID;
const LocalStorage = require("node-localstorage").LocalStorage;
const dotenv = require("dotenv").config();
// var LocalStorage = require("local-storage");
global.localStorage = new LocalStorage("./scratch");
// global.localStorage = new LocalStorage("../public/scratch");

// User Model:
const User = require("../../models/User");
const Item = require("../../models/Item");
const SuperUser = require("../../models/SuperUser");

// Variables:
const maxSize = 1 * 1024 * 1024; // for 1MB
var desiredSaves = [];

// All Variables below here are for utilizing facebook login, CUrrently not being used/commented out:
const webpush = require("web-push");
const passport = require("passport");
const strategy = require("passport-facebook");

//REGEX:
const regexThree = /^\d{5}(?:[-\s]\d{4})?$/;
const regexTwoPhone = /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/;
const regexFourPhone =
  /^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/;
const regexFivePhone =
  /^(\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
const regex =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const emailREGEX = new RegExp(regex);
const phoneREGEX = new RegExp(regexFivePhone);
const zipREGEX = new RegExp(regexThree);

// Standalone Functions----------------------------:

// Image Uploading Middlewares:
// Set The Storage Engine
const multer = require("multer");
const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Init Upload
// Set your file size limit
const upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("myImage");

// Check File Type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Images Only!");
  }
}

// ITEM ROUTES ---------------------------------------------
// @route GET /admin-animation
// @desc  Renders utilities-animation page
router.get("/admin-item-form", function (req, res) {
  if (req.session.superuser_id) {
    // MUST ADD QUERRY IF USER NAME DOESN EXIST AND/OR STORE IT IN SESSION!

    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
      img: req.session.superuser_img

    };
    res.render("admin/admin-create-item-form", {
      superuser: tempUser,
    
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// @route GET /api/abmin-items
// @desc  Renders The Items
router.post("/api/admin-create-item", function (req, res) {
  console.log("AHITTING ADMIN CREATE ITEM");
  if (req.session.superuser_id) {
    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
      img: req.session.superuser_img
    };
    // console.log("TEST OUT! :  "+req.body);
    const { itemName, itemDescription, itemQuantity, itemPrice, itemImage } =
      req.body;
    if (itemName.length <= 2 || itemName.length >= 20) {
      req.flash("error", "Title must be no more than 2 and 20 characters!");
      return res.redirect("/api/admin-items");
    } else {
      console.log("ACCEPTED TITLE");
      


      // IN here later, add functionality to query dTAbase for all items GAin,, and pass to page render

      //Grab ITEMS again.. to pass back to the
      // res.render("admin/admin-show-items", {
      //   superuser: tempUser,
      //   msg: "Item Successfully Created!",
      // });
      // res.redirect("/api/admin-items");
    }
    // Create item:
    // console.log("Data Grabbed: " + itemName, itemDescription, itemQuantity);
    const qtySold = 0;
    const newItem = new Item({
      name: itemName,
      description: itemDescription,
      price: itemPrice,
      quantity: itemQuantity,
      image: itemImage,
      qtySold: qtySold,
    });
    // console.log("NEW DATA BEINGINPUT: " + newItem);
    // Save item to DB:
    newItem.save((err) => {
      // Save new User into DB:
      if (err) {
        // If error:
        console.log("Error Saving Into Databse! - Error Message: " + err);
        req.flash("error", "Error Saving Into Databse!");
        return res.redirect("/api/admin-items");
      } else {
        console.log("Successfully Added Item!");
        req.flash("success", "Created Item Successfully!");

        // IN here later, add functionality to query dTAbase for all items GAin,, and pass to page render

        //Grab ITEMS again.. to pass back to the
        // res.render("admin/admin-show-items", {
        //   superuser: tempUser,
        //   msg: "Item Successfully Created!",
        // });
        res.redirect("/api/admin-items");
        // res.render("/admin/admin-show-items", { superuser: tempUser, msg: "Successfully Created Item!" });
      }
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});


// @route GET /edit-profile
// @desc  Renders The Edit profile Page
router.get("/edit-profile", (req, res) => {
  if (req.session.user_id) {
    // Query DB For User by ID for current data:
    User.findOne({ _id: req.session.user_id }, function (err, user) {
      if (err) {
        req.flash("error", "Must be logged in!"); // Flash error
        res.redirect("/login-page");
      } else {
        // Render Edit Profile page while sending current User Data:
        res.render("edit-profile", { user: user, msg: "Edit YOUR Profile!" });
      }
    });
  } else {
    // else User isnt loggedin or registered:
    req.flash("error", "Must be logged in!");
    res.redirect("/login-page");
  }
});

// @route GET /profile
// @desc  Renders The Profile Page
router.get("/profile-page", (req, res) => {
  if (req.session.user_id) {
    // Query DB for User by ID:
    User.findOne({ _id: req.session.user_id }, function (err, user) {
      if (err) {
        // If not found, User not logged in:
        req.flash("error", "Must be logged in!"); // Flash Error msg
        res.redirect("/login-page"); // Redirect Login page
      } else {
        // Else User Found, Render Profile page with user data:
        res.render("profile", { user: user });
      }
    });
  } else {
    // else User IS NOT logged in or registered, reroute to root:
    req.flash("error", "Must be logged in!"); // Flash error
    res.redirect("/login-page"); // Redirect to Login page
  }
});

// @route GET /edit-profile
// @desc  Renders The Edit profile Page
router.get("/edit-profile", (req, res) => {
  if (req.session.user_id) {
    // Query DB For User by ID for current data:
    User.findOne({ _id: req.session.user_id }, function (err, user) {
      if (err) {
        req.flash("error", "Must be logged in!"); // Flash error
        res.redirect("/login-page");
      } else {
        // Render Edit Profile page while sending current User Data:
        res.render("edit-profile", { user: user, msg: "Edit YOUR Profile!" });
      }
    });
  } else {
    // else User isnt loggedin or registered:
    req.flash("error", "Must be logged in!");
    res.redirect("/login-page");
  }
});

// @route POST /update-Admin-profile
// @desc  Form To Add Extended AdminUser Info
router.post("/update-profile", (req, res) => {
  if (req.session.user_id) {
    User.findOne(
      { _id: new ObjectId(req.session.user_id) },
      function (err, user) {
        if (err) {
          req.flash("error", "Must be logged in!");
          res.redirect("/login-page");
        } else {
          // Destructuring, pulling data from the querried User data:
          const { email, img, premium_credits } = user;
          // Destructuring, pulling data from the req.body(FORM):
          const { name, zipcode, nickname } = req.body;
          // Creating user object for failed update:
          const oldData = {
            email,
            img,
            premium_credits,
          };
          // Create new object with updated User Fields:
          const updatedUser = {
            name,
            email,
            zipcode,
            nickname,
            premium_credits,
            img,
          };
          // Simple Validations: NOTE All validations and inputs for nearly every user Field, commented out as it wasnt needed. I left incase we may want to change that
          if (!name || name === "") {
            console.log("Name Blank");
            req.flash("error", "Please Enter Your Name!");
            res.redirect("/edit-profile");
          } else if (!nickname || nickname === "") {
            console.log("Nickname Blank");
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
          } else if (!zipcode || zipcode === "") {
            console.log("zipcode Blank");
            req.flash("error", "Please Enter your Zipcode!");
            res.redirect("/edit-profile");
          } else if (!zipREGEX.test(zipcode)) {
            console.log("Zipcode Is Invalid");
            req.flash("error", "Please Enter A Valid Zipcode");
            res.redirect("/edit-profile");
          } else {
            console.log("Updated User Info: ", updatedUser);
            // Override current User data with new Object:
            User.updateOne(
              { _id: new ObjectId(req.session.user_id) },
              { $set: updatedUser },
              (error, result) => {
                if (!result) {
                  // If the result failed, then flash error and re-route to Profile page:
                  console.log("Failed to update Profile Info.");
                  req.flash("error", "Failed To Update Profile Info");
                  return res.render("profile", {
                    user: oldData,
                    msg: "Profile Unfortunately Failed To Update",
                  });
                }
                console.log("Successfully Updated!");
                return res.render("profile", {
                  user: updatedUser,
                  msg: "Profile Successfully Updated! THANK YOU!",
                });
              }
            );
          }
        }
      }
    );
  }
});

// @route POST /admin-item-img
// @desc  Uploads image to For An Item to server/local-storage
router.post("/admin-item-img", (req, res) => {
  console.log("hitting here admin-upload");
  upload(req, res, (err) => {
    if (err) {
      // Validaition for certain image limitations: Size, And Images ONLY:
      if (err.code === "LIMIT_FILE_SIZE") {
        console.log("Image to big!");
        req.flash("error", "Image Size To Big! 1 MB Maximum!");
        res.redirect("/admin-edit-profile");
      } else {
        console.log("Images Only!", err);
        req.flash("error", "Images Only!");
        res.redirect("/admin-edit-profile");
      }
    } else if (req.file == undefined) {
      console.log("hitting here under undefined");
      req.flash("error", "No File Selected!");
      res.redirect("/admin-edit-profile");
    } else {
      console.log("hitting here attempting to pull USER id from req.session: "+req.session.superuser_id);
      // Check if user is loging in, if not re-route to root:
      if (req.session.superuser_id) {
        // Query by ID:
        console.log("Found superuser, continuing");
        const tempUser = {
          name: req.session.superuser_name,
          img: req.session.superuser_img,
          _id: req.session.superuser_id

        }
      // console.log("CURRENT REQ.body!: "+ req.body.item_id, req.body.img, req.body.name, req.body.description);
      console.log("CURRENT ITEM ID!!!! HERE!!! !: "+ req.body.item_id);
        
        Item.findById(req.body.item_id, (err, item) => {
          if (err) {
            req.flash("error", "Fields are empty");
            return res.redirect("admin/admin-update-item-form");
          } else {
            // DESTRUCTURING DATA AND PULLING FROM THE REQ.BODY:

            // HERE! 11-1-23 its not pulling the attributes form the item proiperly! ?  updating is working well but need to pull attributes!
         
            // console.log("TEST Adding to iamge: "+ toString(req.file.filename));
            // Creating new Object Of Said Item Organized as desired to be input.
            
      
            // Creating new Object Of Said Item Organized as desired to be input.

            // const { name, description, quantity, price, image, qtySold } = req.body;
            // Overwrite item:
            const updatedItem = {
              name: item.name,
              description: item.description,
              price: item.price,
              quantity: item.quantity,
              image: `uploads/${req.file.filename}`, // Declaring path to uploaded image:
              qtySold: item.qtySold,
            };
           
            console.log("hitting here attempting to update");

            console.log("Updated new item Attempting: ", updatedItem);
            Item.updateOne(
              { _id: req.body.item_id },
              { $set: updatedItem },
              (error, result) => {
                if (error) {
                  // return res.status(500).send(error);
                  console.log("Upadte Item", error);
                  req.flash("error", "Failed to Update Item");
                  return res.redirect("admin/admin-update-item-form");
                }
                console.log("Item Successfully Updated!,item is:" +updatedItem.image + "----");
                req.flash("success", "Updated Item");
                // return res.redirect("admin/admin-update-item-form");
                // return res.render("admin/admin-update-item-form", {superuser:tempUser}); 
                
                return res.redirect("api/admin-items")
              }
            );
          }
        });
      }
    }
  });
});

// @route POST /admin-upload
// @desc  Uploads image to server/local-storage
router.post("/admin-upload", (req, res) => {
  console.log("hitting here admin-upload");
  upload(req, res, (err) => {
    if (err) {
      // Validaition for certain image limitations: Size, And Images ONLY:
      if (err.code === "LIMIT_FILE_SIZE") {
        console.log("Image to big!");
        req.flash("error", "Image Size To Big! 1 MB Maximum!");
        res.redirect("/admin-edit-profile");
      } else {
        console.log("Images Only!", err);
        req.flash("error", "Images Only!");
        res.redirect("/admin-edit-profile");
      }
    } else if (req.file == undefined) {
      console.log("hitting here under undefined");
      req.flash("error", "No File Selected!");
      res.redirect("/admin-edit-profile");
    } else {
      console.log("hitting here attempting to pull id from req.session: "+req.session.superuser_id);
      // Check if user is loging in, if not re-route to root:
      if (req.session.superuser_id) {
        // Query by ID:
        console.log("FOR THE HELL OF IT");
        SuperUser.findOne(
          { _id: new ObjectId(req.session.superuser_id) },
          function (err, superuser) {
            if (err) {
              console.log("HITTING HERE- Error: "+ err);
              req.flash("error", "Must be logged in!");
              res.redirect("/admin-swordfish");
            } else {
              // Destructuring, pulling data from req.body:
              // HERE 10-30W
              console.log("SUPER USER FOUND ATTEMPTING TO GRAB DATA..")
              const { name, email, nickname, img } = superuser;
              // Creating new object with updated user fields:
              const updatedUser = {
                name, 
                email, 
                nickname,
                img: `uploads/${req.file.filename}`, // Declaring path to uploaded image:
              };
              console.log("hitting here attempting to update");

              // console.log("Updated User Image: ", updatedUser);
              // Overriding push to Mongo db, overwritting currnt data and replacing with new updated object:
              SuperUser.updateOne(
                { _id: new ObjectId(req.session.superuser_id) },
                { $set: updatedUser },
                (error, result) => {
                  if (error) {
                    // return res.status(500).send(error);
                    console.log("Failed to upload image... Error: ", error);
                    req.flash("error", "Failed to upload image"); // FLash error:
                    return res.redirect("/admin-edit-profile"); // Redirect Edit Profile
                  }
                  console.log("Successfully Updated!");
                  // Render Profile page with updated User Info:
                  return res.render("admin/admin-profile", {
                    superuser: updatedUser,
                    msg: "Image Successfully Updated!",
                  });
                }
              );
            }
          }
        );
      }
    }
  });
});

// @route GET /admin-edit-profile
// @desc  Renders The Edit ADmin profile Page
router.get("/admin-edit-profile", (req, res) => {
  if (req.session.superuser_id) {
    // Query DB For superuser by ID for current data:
    SuperUser.findOne({ _id: req.session.superuser_id }, function (err, superuser) {
      if (err) {
        req.flash("error", "Must be logged in!"); // Flash error
        res.redirect("/login-page");
      } else {
        // Render Edit Profile page while sending current superuser Data:
        res.render("admin/admin-edit-profile", { superuser: superuser, msg: "Edit YOUR Profile!" });
      }
    });
  } else {
    // else User isnt loggedin or registered:
    req.flash("error", "Must be logged in!");
    res.redirect("/admin-swordfish");


    
  }
});

// @route GET /admin-profile
// @desc  Renders The ADmin Profile Page
router.get("/admin-profile-page", (req, res) => {
  if (req.session.superuser_id) {
    // Query DB for User by ID:
    SuperUser.findOne({ _id: req.session.superuser_id }, function (err, superuser) {
      if (err) {
        // If not found, superuser not logged in:
        req.flash("error", "Must be logged in!"); // Flash Error msg
        res.redirect("/login-page"); // Redirect Login page
      } else {
        // Else superuser Found, Render Profile page with superuser data:
        res.render("admin/admin-profile", { superuser: superuser });
      }
    });
  } else {
    // else User IS NOT logged in or registered, reroute to root:
    req.flash("error", "Must be logged in!"); // Flash error
    res.redirect("/admin-swordfish"); // Redirect to Login page
  }
});

// @route POST /update-admin-profile
// @desc  Form To Add Extended superUser Info
router.post("/admin-update-profile", (req, res) => {
  if (req.session.superuser_id) {
    SuperUser.findOne(
      { _id: new ObjectId(req.session.superuser_id) },
      function (err, superuser) {
        if (err) {
          req.flash("error", "Must be logged in!");
          res.redirect("/admin-login");
        } else {
          // Destructuring, pulling data from the querried User data:
          const { email, img, premium_credits } = superuser;
          // Destructuring, pulling data from the req.body(FORM):
          const { name, zipcode, nickname } = req.body;
          // Creating user object for failed update:
          const oldData = {
            email,
            img,
            premium_credits,
          };
          // Create new object with updated User Fields:
          const updatedUser = {
            name,
            email,
            zipcode,
            nickname,
            premium_credits,
            img,
          };
          // Simple Validations: NOTE All validations and inputs for nearly every user Field, commented out as it wasnt needed. I left incase we may want to change that
          if (!name || name === "") {
            console.log("Name Blank");
            req.flash("error", "Please Enter Your Name!");
            res.redirect("/admin-edit-profile");
          } else if (!nickname || nickname === "") {
            console.log("Nickname Blank");
            req.flash("error", "Please Enter your Nickname!");
            res.redirect("/admin-edit-profile");
            // }else if(!country || country === "default"){
            //   console.log("Country Blank")
            //   req.flash("error", "Your Country Must Be Selected!");
            //   res.redirect("/edit-profile");
            // }else if(!gender || gender === "default"){
            //   console.log("Gender Blank");
            //   req.flash("error", "Your Gender Must Be Selected!");
            //   res.redirect("/edit-profile");
          } else if (!zipcode || zipcode === "") {
            console.log("zipcode Blank");
            req.flash("error", "Please Enter your Zipcode!");
            res.redirect("/admin-edit-profile");
          } else if (!zipREGEX.test(zipcode)) {
            console.log("Zipcode Is Invalid");
            req.flash("error", "Please Enter A Valid Zipcode");
            res.redirect("/admin-edit-profile");
          } else {
            console.log("Updated User Info: ", updatedUser);
            // Override current User data with new Object:
            SuperUser.updateOne(
              { _id: new ObjectId(req.session.superuser_id) },
              { $set: updatedUser },
              (error, result) => {
                if (!result) {
                  // If the result failed, then flash error and re-route to Profile page:
                  console.log("Failed to update Profile Info.");
                  req.flash("error", "Failed To Update Profile Info");
                  return res.render("/admin-profile-page", {
                    superuser: oldData,
                    msg: "Profile Unfortunately Failed To Update",
                  });
                }
                console.log("Successfully Updated!");
                return res.render("admin/admin-profile", {
                  superuser: updatedUser,
                  msg: "Profile Successfully Updated! THANK YOU!",
                });
              }
            );
          }
        }
      }
    );
  }
});



// @route GET /api/abmin-items
// @desc  Renders The Items
router.get("/api/admin-items", function (req, res) {
  if (req.session.superuser_id) {
    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
      img: req.session.superuser_img
    };
    Item.find()
      .sort({ created_at: -1 })
      .then((items) => {
        if (items && items.length > 0) {
          console.log("FoundItems!");
          // req.flash("error", "Found Items!");
          req.flash("success", "FOUND ITEMS! Super User Logged In!");
          // req.flash("success", "Super User Logged In!");
          res.render("admin/admin-show-items", {
            
            items: items,
            msg: "Grabbed Available Items!",
            superuser: tempUser,
          });
        } else {
          console.log("No Items!");
          req.flash("error", "There Are NO Items!");
          res.render("admin/admin-show-items", {
            items: items,
            superuser: tempUser,
          });
        }
      });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// @route GET /api/items
// @desc  Renders The Items
// router.get("/api/items", function (req, res) {
//   // console.log("TEST HITTING HERE: ");
//   Item.find()
//     .sort({ date: -1 })
//     .then((items) => {
//       if (items) {
//         return res.render("products", {
//           items: items,
//           msg: "Grabbed Available Items!",
//         });
//       } else {
//         console.log("No Items!");
//         req.flash("error", "NO Items!");
//         return res.redirect("/");
//       }
//     });
// });

// @ desc    Get ALL items
// @ route    GET api/items
// @ access   Public
// router.get("/", (req, res) => {
//   Item.find()
//   .sort({ date: -1 })
//   .then(items => res.json(items))
//   .catch(err => res.status(404).json({message: "Error", error: err}))
// });

// @ desc    Create A New Item
// @ route    POST api/items
// @ access   Public
router.post("/api/items/create", (req, res) => {
  const { name, description, quantity, price, image, qtySold } = req.body;
  // Create item:
  const newItem = new Item({
    name,
    description,
    price,
    quantity,
    image,
    qtySold,
  });
  // Save item to DB:
  if (items) {
    console.log("Grabbed Items!");
    res.render("/api/admin-items", {
      items: items,
      msg: "Grabbed Available Items!",
    });
  } else {
    res.render("/api/admin-items", {
      items: items,
      msg: "Grabbed Available Items!",
    });
  }
});

// @ route    POST api/items/:id
// @ desc    Delete a Item:
// @ access   Public
router.post("/api/admin-delete-item", (req, res) => {
  console.log("ITEM ID output delete: " + req.body.item_id);
  if (req.session.superuser_id) {
    Item.findById(req.body.item_id).then((item) => {
      if (item) {
        console.log("FoundItem!");
        item.remove().then(() => {
          console.log("Delete Item!");
          req.flash("error", "Deleted Item!");
          res.redirect("/api/admin-items");
        });

        // res.render("admin/admin-show-items", {items: items, msg: 'Grabbed Available Items!', superuser: tempUser });
      } else {
        console.log("Couldnt find item by ID!");
        req.flash("error", "Couldnt Find Item By That ID!");
        return res.redirect("/api/admin-items");
      }
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});


// @ route    POST /show-single-item-login
// @ desc    view a single item while logged in:
// @ access   Public
router.post("/show-single-item-login", function (req, res) {
  console.log("Hitting single item regular user: ");

  console.log("ITEM ID output Show item form: " + req.body.item_id);
  if (req.session.superuser_id) {
    console.log("hitting here superuser logged in");
    // MUST ADD QUERRY IF superuser NAME DOESN EXIST AND/OR STORE IT IN SESSION!
      const tempUser = {
        name: req.session.superuser_name,
        _id: req.session.superuser_id,
        img: req.session.superuser_img
      }
       // console.log("ITEM ID output update form: " + req.body.item_id);
    Item.findById(req.body.item_id).then((item) => {
      if (item) {

        // console.log("TEST HERE! UPDATED ITEM!: "+ item);
        // req.flash("error", "Found Item");
        return res.render("single-products", {
          superuser: tempUser,
          item: item, // DONT BE FOOLED! THIS IS ITEM! NOT ITEMS! SINGLE! FOr future preference when rendering Single View Of Said newly Created Item:s
        });
      } else {
        console.log("couldnt grab item");
        req.flash("error", "Couldnt find item!");
        res.redirect("/");
      }
    });
      }else if(req.session.user_id) {
        
          console.log("Hitting here regular user logged in");
      // MUST ADD QUERRY IF superuser NAME DOESN EXIST AND/OR STORE IT IN SESSION!
      const tempUser = {
        name: req.session.user_name, 
        _id: req.session.user_id,
        img: req.session.user_img
      };
    
    console.log("ITEM ID output update for user logged in item id: " + req.body.item_id);
    Item.findById(req.body.item_id).then((item) => {
      if (item) {

        // console.log("TEST HERE! UPDATED ITEM!: "+ item);
        // req.flash("error", "Found Item");
        return res.render("single-products", {
          user: tempUser,
          item: item, // DONT BE FOOLED! THIS IS ITEM! NOT ITEMS! SINGLE! FOr future preference when rendering Single View Of Said newly Created Item:s
        });
      } else {
        console.log("couldnt grab item");
        req.flash("error", "Couldnt find item!");
        res.redirect("/");
      }
    });

  }else if(!req.session.superuser_id || !req.session.user_id) {
    console.log("Hitting here NOT LOGGED IN")
    const tempUserTwo = {
      name: "GUEST",
      _id: null,
      img: "whatever"
    };
    console.log("SHOWING NON LOGGED IN VALUES: "+ tempUserTwo.name,tempUserTwo._id,tempUserTwo.img,)
    Item.findById(req.body.item_id).then((item) => {
      if (item) {
        console.log("HITTING HERE FOUND ITEM");

        // console.log("TEST HERE! UPDATED ITEM!: "+ item);
        // req.flash("error", "Found Item");
        return res.render("single-products", {
          user: tempUserTwo,
          item: item, // DONT BE FOOLED! THIS IS ITEM! NOT ITEMS! SINGLE! FOr future preference when rendering Single View Of Said newly Created Item:s
        });
      } else {
        console.log("couldnt grab item");
        req.flash("error", "Couldnt find item!");
        res.redirect("/");
      }
    });
  }
});
  
  

// Update item:
router.post("/admin-item-update-form", function (req, res) {
  console.log("ITEM ID output update form: " + req.body.item_id);
  if (req.session.superuser_id) {
    // MUST ADD QUERRY IF USER NAME DOESN EXIST AND/OR STORE IT IN SESSION!
    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
      img: req.session.superuser_img
    };
    console.log("ITEM ID output update form: " + req.body.item_id);
    Item.findById(req.body.item_id).then((item) => {
      if (item) {
  
        // console.log("TEST HERE! UPDATED ITEM!: "+ item);
        // req.flash("error", "Found Item");
        return res.render("admin/admin-update-item-form", {
          superuser: tempUser,
          item: item, // DONT BE FOOLED! THIS IS ITEM! NOT ITEMS! SINGLE! FOr future preference when rendering Single View Of Said newly Created Item:s
        });
      } else {
        console.log("Couldnt Find Item!");
        req.flash("error", "Couldnt find item");
        return res.redirect("/api/admin-items");
      }
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// @ route    PUT api/items/ID
// @ desc    Edit Item By ID Route
// @ access   Private
router.post("/api/admin-update-item", (req, res) => {
  console.log("ITEM ID output update: " + req.body.item_id);
  Item.findById(req.body.item_id, (err, item) => {
    if (err) {
      req.flash("error", "Fields are empty");
      return res.redirect("/admin-item-update-form");
    } else {
      // DESTRUCTURING DATA AND PULLING FROM THE REQ.BODY:
      const {
        itemName,
        itemPrice,
        itemQuantity,
        itemQtySold,
        myImage,
        itemDescription,
      } = req.body;

      if (!itemName || itemName === "") {
        console.log("Name Is blank");
        req.flash("error", "Please Enter A Name");
        res.redirect("/admin/admin-update-item-form");
      } else if (!itemPrice || itemPrice === "") {
        console.log("email Is blank");
        req.flash("error", "Please Enter An Email");
        res.redirect("/admin/admin-update-item-form");
      
      } else if (!itemQtySold || itemQtySold === "") {
        console.log("Invalid Nickname");
        req.flash("error", "Please Enter A Nickname");
        res.redirect("/admin/admin-update-item-form");
      } else if (!itemDescription|| itemDescription === "") {
        console.log("Invalid Nickname");
        req.flash("error", "Please Enter A Nickname");
        res.redirect("/admin/admin-update-item-form");
      } else if (!itemQuantity|| itemQuantity === "") {
        console.log("Invalid Nickname");
        req.flash("error", "Please Enter A Nickname");
        res.redirect("/admin/admin-update-item-form");
      
    
      } else {

        // ENd of validation ------------
        // Check for existing user:
 

        // Creating new Object Of Said Item Organized as desired to be input.
        const newItem = {
          name: itemName,
          price: itemPrice,
          quantity: itemQuantity,
          qtySold: itemQtySold,
          image: item.image,
          description: itemDescription,
        };

        // console.log("Updated new item: ", newItem);
        Item.updateOne(
          { _id: req.body.item_id },
          { $set: newItem },
          (error, result) => {
            if (error) {
              // return res.status(500).send(error);
              console.log("Upadte Item", error);
              req.flash("error", "Failed to Update Item");
              return res.redirect("/api/admin-items");
            }
            console.log("Successfully Updated!, New item is:" +newItem.imageg + "----"+ newItem.name);
            req.flash("success", "Updated Item");
            return res.redirect("/api/admin-items");
          }
        );
      }
    }
  });
});

// @ route    GET api/items/ID
// @ desc    Show one item by ID
// @ access   Private
router.get("/items/:id", (req, res) => {
  Item.findById(req.params.id, (err, item) => {
    if (err) {
      // res.json({ message: "Error", error: "ID doesn't exist..." });
      res.redirect("/api/index");
    } else {
      // res.json({ message: "Success", data: item });
      res.render("api/products");
    }
  });
});

//     END OF ITEM ROUTES:     ------------

// SUPER USER ROUTES  ---------------------------------------------

// TEND HEST ADMIN MENUS

// @route GET /items-admin-menu-test
// @desc  Renders aasdasasdaf
// router.get("/admin-test", function (req, res) {
//   res.render("admin/admin-menu");
// });

// @route GET /admin-animation
// @desc  Renders utilities-animation page
router.get("/admin-reg-render", function (req, res) {
  if (req.session.superuser_id) {
    // MUST ADD QUERRY IF USER NAME DOESN EXIST AND/OR STORE IT IN SESSION!

    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
    };
    req.flash("success", "YOU ARE THE ONE NEO!");
    res.render("admin/admin-menu", {
      superuser: tempUser,
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// @route POST /admin-logout
// @desc  Logout A SUPERUSER ADMIN
router.post("/admin-logout", (req, res) => {
  // req.session = null;

  req.session.destroy();
  // localStorage._deleteLocation();
  localStorage.clear();
  // console.log(
  //   "Checking if data solidified still: Cleared all session and local Storage!"
  // );
  req.flash("success", "Successfully Loged out! ");
  res.redirect("/");
});

// @route GET /admin-animation
// @desc  Renders utilities-animation page
router.get("/admin-animation", function (req, res) {
  if (req.session.superuser_id) {
    // MUST ADD QUERRY IF USER NAME DOESN EXIST AND/OR STORE IT IN SESSION!

    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
    };
    res.render("admin/utilities-animation", {
      superuser: tempUser,
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// @route GET /admin-borders
// @desc  Renders utilities-borders page
router.get("/admin-borders", function (req, res) {
  if (req.session.superuser_id) {
    // MUST ADD QUERRY IF USER NAME DOESN EXIST AND/OR STORE IT IN SESSION!
    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
    };
    res.render("admin/utilities-borders", {
      superuser: tempUser,
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// @route GET /admin-color
// @desc  Renders utilities-color page
router.get("/admin-color", function (req, res) {
  if (req.session.superuser_id) {
    // MUST ADD QUERRY IF USER NAME DOESN EXIST AND/OR STORE IT IN SESSION!
    req.flash("error", "SUPERUSER IDENTIFIED!");
    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
    };
    res.render("admin/utilities-color", {
      superuser: tempUser,
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// @route GET /admin-other
// @desc  Renders utilities-color page
router.get("/admin-other", function (req, res) {
  if (req.session.superuser_id) {
    // MUST ADD QUERRY IF USER NAME DOESN EXIST AND/OR STORE IT IN SESSION!
    req.flash("error", "SUPERUSER IDENTIFIED!");
    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
    };
    res.render("admin/utlities-other", {
      superuser: tempUser,
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// @route GET /admin-tables
// @desc  Renders tables page
router.get("/admin-tables", function (req, res) {
  if (req.session.superuser_id) {
    // MUST ADD QUERRY IF USER NAME DOESN EXIST AND/OR STORE IT IN SESSION!
    req.flash("error", "SUPERUSER IDENTIFIED!");
    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
    };
    res.render("admin/tables", {
      superuser: tempUser,
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// @route GET /admin-cards
// @desc  Renders cards page
router.get("/admin-cards", function (req, res) {
  if (req.session.superuser_id) {
    // MUST ADD QUERRY IF USER NAME DOESN EXIST AND/OR STORE IT IN SESSION!
    req.flash("error", "SUPERUSER IDENTIFIED!");
    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
    };
    res.render("admin/cards", {
      superuser: tempUser,
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// @route GET /admin-charts
// @desc  Renders charts page
router.get("/admin-charts", function (req, res) {
  if (req.session.superuser_id) {
    // MUST ADD QUERRY IF USER NAME DOESN EXIST AND/OR STORE IT IN SESSION!
    req.flash("error", "SUPERUSER IDENTIFIED!");
    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
    };
    res.render("admin/charts", {
      superuser: tempUser,
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// @route GET /admin-forgot-password
// @desc  Renders forgot-password page
router.get("/admin-forgot-password", function (req, res) {
  if (req.session.superuser_id) {
    // MUST ADD QUERRY IF USER NAME DOESN EXIST AND/OR STORE IT IN SESSION!
    req.flash("error", "SUPERUSER IDENTIFIED!");
    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
    };
    res.render("admin/forgot-password", {
      superuser: tempUser,
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// @route GET /admin-buttons
// @desc  Renders buttons page
router.get("/admin-buttons", function (req, res) {
  if (req.session.superuser_id) {
    // MUST ADD QUERRY IF USER NAME DOESN EXIST AND/OR STORE IT IN SESSION!
    req.flash("error", "SUPERUSER IDENTIFIED!");
    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
    };
    res.render("admin/buttons", {
      superuser: tempUser,
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// @route GET /admin-blank
// @desc  Renders blank page
router.get("/admin-blank", function (req, res) {
  if (req.session.superuser_id) {
    // MUST ADD QUERRY IF USER NAME DOESN EXIST AND/OR STORE IT IN SESSION!
    req.flash("error", "SUPERUSER IDENTIFIED!");
    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
    };
    res.render("admin/blank", {
      superuser: tempUser,
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// @route GET /admin-navbar
// @desc  Renders renders admin nav bar with session name
router.get("/admin-navbar", function (req, res) {
  if (req.session.superuser_id) {
    // MUST ADD QUERRY IF USER NAME DOESN EXIST AND/OR STORE IT IN SESSION!
    req.flash("error", "SUPERUSER IDENTIFIED!");
    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
    };
    res.render("/admin/admin-partials/admin-navbar", {
      superuser: tempUser,
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// @route GET /admin-404
// @desc  Renders 4040 page
router.get("/admin-404", function (req, res) {
  if (req.session.superuser_id) {
    // MUST ADD QUERRY IF USER NAME DOESN EXIST AND/OR STORE IT IN SESSION!
    req.flash("error", "SUPERUSER IDENTIFIED!");
    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
    };
    res.render("admin/404", {
      superuser: tempUser,
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// @route GET /admin-404
// @desc  Renders 4040 page
router.get("/admin-snap", function (req, res) {
  res.render("admin-snap");
});

// TEND HEST ADMIN MENUS

// @route GET /admin-SwordFish
// @desc  Renders The Super user Login page
router.get("/admin-SwordFish", function (req, res) {
  localStorage.clear();
  res.render("admin-login");
});

// @route GET /admin-register-SwordFish
// @desc  Renders Suoper user register page
router.get("/admin-register-SwordFish", function (req, res) {
  localStorage.clear();
  res.render("admin-register");
});

// @route GET /admin-menu
// @desc  Renders The Super User Control Menu
router.get("/admin-menu", async function (req, res) {
  console.log("hitting here test1 2332: ");
  // res.render("admin-test");
  if (req.session.superuser_id) {
    const tempUser = {
      name: req.session.superuser_name,
      _id: req.session.superuser_id,
      img: req.session.superuser_img
    };
    console.log("TEST ADMIN-MENU: "+ req.session+ "AND: "+ req.session.superuser_img);
    // MUST ADD QUERRY IF USER NAME DOESN EXIST AND/OR STORE IT IN SESSION!
    // req.flash("error", "SUPERUSER IDENTIFIED!");
    // SUCCESS FOUND USER:

    res.render("admin/admin-menu", {
      superuser: tempUser,
    });
  } else {
    console.log("YOU ARE NOT THE ONE!");
    req.flash("error", "YOU ARE NOT THE ONE!");
    res.redirect("/");
  }
});

// LOGIN ADMIN:  ------------

// NOTE HERE! LEFT OFF ON LOGIN HERE!
// @route  POST /login
// @desc  For Logging In A User
router.post("/admin-login", (req, res) => {
  console.log("Initializing Login API");
  // if (localStorage.getItem(superuser_name != "undefined")) {
  //   localStorage.clear();
  // }
  // console.log("TEST REQ BODY: "+ req.body.emailLog);
  const { emailAdmin, passwordAdmin } = req.body;
  const emailLower = emailAdmin.toLowerCase();
  // console.log("CURRENT GRAB OF DATA EMAIL  ADMIN : "+ emailLower);
  // console.log("CURRENT GRAB OF DATA PASS:  ADMIN : "+ passwordAdmin);

  // Simple validation: NOTE! THIS IS JUST FOR NOW! WILL BE REPLACED WITH REAL VALIDATOR MIDDLEWARE/Framework and/or Custom error handeling.
  if (!emailAdmin || !passwordAdmin) {
    console.log("Please Enter All Login Fields!");
    req.flash("error", "Please Enter All Login Fields");
    res.redirect("/admin-SwordFish");
  } else {
    // Query DB For User By Specified Email:
    SuperUser.findOne({ email: emailLower }, function (err, superuser) {
      if (err) {
        req.flash("error", "superuser Doesnt Exists");
        res.redirect("/admin-SwordFish");
      } else {
        if (superuser) {
          // superuser was found
          // console.log("found superuser with email ADMIN " + superuser.email);
          // Comparing Password with stored hash vs superuser input:
          bcrypt.compare(
            passwordAdmin,
            superuser.password,
            function (err, result) {
              if (result) {
                // If Password is a match, then throw superuser ID into session and route to Admin Menu page:
                req.session.superuser_id = superuser._id; // Throwing ID into session:
                req.session.superuser_name = superuser.name; // Throwing name into session:
                req.session.superuser_img = superuser.img;
                req.session.superuser_premium_credits = superuser.premium_credits; 

                console.log("TEST HERE SUPER ID:! "+ superuser._id);
                
                // Adding into local storage as well:

                localStorage.setItem("superuser_name", superuser.name);
                localStorage.setItem("superuser_id", superuser._id);
                localStorage.setItem("superuser_img", superuser.img);
                

                // res.render("admin-menu", {
                //   superuser: superuser,
                //   msg: "Successfully Logged in! Welcome Back!",
                // });
                req.flash("success", "Successfully Logged in!");
                const tempUser = {
                  name: req.session.superuser_name,
                  _id: req.session.superuser_id,
                  img: req.session.superuser_img
                };
                res.redirect("/admin-menu");
                // res.render("/admin-menu", {
                //   superuser: tempUser,
                // });
                // console.log("HITTING HERE! 2  ADmin login what in session: "+ req.session.superuser_name);
                // console.log("HITTING HERE! 2  ADmin login what in session: "+ req.session.superuser_id);
              } else {
                // Else passwords did not match with stored hash:
                console.log("Wrong Password!");
                req.flash("error", "Wrong Password!");
                res.redirect("/admin-SwordFish");
              }
            }
          );
        } else {
          // superuser not found
          console.log("superuser Not Found!");
          req.flash("error", "superuser Not found");
          res.redirect("/admin-SwordFish");
        }
      }
    });
  }
});

// @route POST /admin-register
// @desc  Registers A New SUPER USER ADMIN:
router.post("/admin-register", (req, res) => {
  var isTheOne = false; // Global variable for boolean trigger. (Kinda pointless currently)
  // Destructuring, Pulling the values out from request.body
  const { emailAdmin, passwordAdmin, godcode, userName } = req.body;
  let lowerEmail = emailAdmin.toLowerCase();

  // console.log("email lower case", lowerEmail);
  // console.log("Data being grabbed is :", req.body);

  if (!godcode || godcode === "") {
    console.log("Please enter the NEO CODE!");
    req.flash("error", "Please enter the NEO CODE!");
    res.redirect("/admin-register-SwordFish");
  }

  if (JSON.stringify(process.env.GODCODE) === JSON.stringify(godcode)) {
    isTheOne = true;
    console.log("YOU ARE THE ONE! ACCESS GRANTED! GOING DEEPER! ");
  } else {
    isTheOne = false;
    console.log("YOU ARE NOT THE ONE! ACCESS DENIED!");
    req.flash("error", "YOU ARE NOT THE ONE! ACCESS DENIED!");
    res.redirect("/admin-register-SwordFish");
  }

  // Continue Validating the rest of the Req.Body:
  if (!userName || userName === "") {
    console.log("Name Is blank");
    req.flash("error", "Please Enter A Name");
    res.redirect("/admin-register-SwordFish");
  } else if (!emailAdmin || emailAdmin === "") {
    console.log("email Is blank");
    req.flash("error", "Please Enter An Email");
    res.redirect("/admin-register-SwordFish");
  } else if (!emailREGEX.test(emailAdmin)) {
    console.log("Invalid Email");
    req.flash("error", "Please Enter A Valid Email");
    res.redirect("/admin-register-SwordFish");
  } else if (!passwordAdmin || passwordAdmin === "") {
    console.log("Password Is blank");
    req.flash("error", "Please Enter A Password");
    res.redirect("/admin-register-SwordFish");
  } else {
    // ENd of validation ------------
    // Check for existing user:
    SuperUser.findOne({ email: emailAdmin }).then((superuser) => {
      if (superuser) {
        console.log("superuser Already Exists!");
        req.flash("error", "superuser Already Exists!");
        return res.redirect("/admin-register-SwordFish");
      }
      const newSuperUser = new SuperUser({
        name: userName,
        email: lowerEmail,
        password: passwordAdmin,
        img: "../uploads/default-photo-admin.jpg",
        premium_credits: 0,
        isTheOne: true,
      });
      // Create salt and hashed password utilizing bcrypt:
      if (newSuperUser.isTheOne) {
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newSuperUser.password, salt, (err, hash) => {
            if (err) throw err;
            newSuperUser.password = hash;
            // console.log("HASHED Password", hash);
            newSuperUser.save((err) => {
              // Save new User into DB:
              if (err) {
                // If error:
                console.log("Error Saving Into Database!!: RESULTS: " + err);
                req.flash("error", "Error Saving Into Databse!!");
                return res.redirect("/admin-register-SwordFish");
              } else {
                console.log("success Adding into the data base!");
                // Add ID Into Session:
                req.session.superuser_id = newSuperUser._id;
                req.session.superuser_name = newSuperUser.name;

                localStorage.setItem("superuser_id", newSuperUser._id);
                localStorage.setItem("superuser_name", newSuperUser.name);
                // localStorage.setItem("user_nickname", newSuperUser.nickname);

                // Send Email Function with nodemailer:
                // Render Admin Control Panel with New Super User info:
                // res.render("/admin/admin-menu", {
                //   superuser: newSuperUser,
                //   msg: `YOU ARE THE ONE!`,
                // });
                res.redirect("admin-reg-render");
              }
            });
          });
        });
      }
    });
  }
});

// END OF SUPER USER FUNCTIONALITY------------------------

// @route GET /success
// @desc  The TypeCast Official Logged In Home Page - *NOTE* Old, No longer being used but left it here for now:
router.get("/success", function (req, res) {
  if (req.session.user_id) {
    User.findOne({ _id: req.session.user_id }, function (err, user) {
      if (err) {
        req.flash("error", "Must be logged in!");
        res.redirect("/");
      } else {
        
        res.render("profile", { user: user });
      }
    });
  } else {
    req.flash("error", "Must be logged in!");
    res.redirect("/");
  }
});

// @route POST /logout
// @desc  Logout A User
router.post("/logout", (req, res) => {
  console.log("HITTING LOGOUT AREA! ");
  req.session.destroy();
  localStorage.clear();
  res.redirect("/");
});

// @route POST /register
// @desc  Registers A New User
router.post("/register", (req, res) => {
  // Destructuring, Pulling the values out from request.body
  const { emailLog, passwordLog, userName, nickname } = req.body;
  let lowerEmail = emailLog.toLowerCase();
  // console.log("email lower case", lowerEmail);
  // console.log("Data being grabbed is :", req.body);

  if (!userName || userName === "") {
    console.log("Name Is blank");
    req.flash("error", "Please Enter A Name");
    res.redirect("/register-page");
  } else if (!emailLog || emailLog === "") {
    console.log("email Is blank");
    req.flash("error", "Please Enter An Email");
    res.redirect("/register-page");
  } else if (!emailREGEX.test(emailLog)) {
    console.log("Invalid Email");
    req.flash("error", "Please Enter A Valid Email");
    res.redirect("/register-page");
  } else if (!nickname || nickname === "") {
    console.log("Invalid Nickname");
    req.flash("error", "Please Enter A Nickname");
    res.redirect("/register-page");
  }
  // else if(!gender || gender === "" || gender === "default"){
  //   console.log("Gender Is blank")
  //   req.flash("error", "Please Enter A Gender")
  //   res.redirect("/register-page");
  // }
  else if (!passwordLog || passwordLog === "") {
    console.log("Password Is blank");
    req.flash("error", "Please Enter A Password");
    res.redirect("/register-page");
    // }else if(password != password2){
    //   console.log("Passwords DO NOt match!")
    //   req.flash("error", "Passwords Do not Match!")
    //   res.redirect("/register-page");
    // }else{
  } else {
    // ENd of validation ------------
    // Check for existing user:
    User.findOne({ email: emailLog }).then((user) => {
      if (user) {
        console.log("User Already Exists!");
        req.flash("error", "User Already Exists!");
        return res.redirect("/");
      }

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
        password: passwordLog,
        nickname: nickname,
        premium_credits: 0,
        img: "../uploads/default-photo.jpg",
      });
      // Create salt and hashed password utilizing bcrypt:
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          // console.log("HASHED Password", hash);
          newUser.save((err) => {
            // Save new User into DB:
            if (err) {
              // If error:
              console.log("User Already Exists!");
              req.flash("error", "User Already Exists");
              return res.redirect("/register-page");
            }
          });
          console.log("success");
          // Add ID Into Session:
          req.session.user_id = newUser._id;
          req.session.user_name = newUser.name;
          req.session.user_nickname = newUser.nickname;
          req.session.user_img = newUser.img;
          req.session.user_email = newUser.email;

          localStorage.setItem("user_id", newUser._id);
          localStorage.setItem("user_name", newUser.name);
          localStorage.setItem("user_nickname", newUser.nickname);
          localStorage.setItem("user_email", newUser.email);
          localStorage.setItem("user_email", newUser.img);
          

          // Send Email Function with nodemailer:
          // sendEmail(email, name) HERE! MOTE! SENDING EMAIL CALL! :
          // Render Profile page with New user info:
          res.render("profile", {
            user: newUser,
            msg: "Account Created! Please Check Your Email!",
          });
        });
      });
    });
  }
});

// END LOGIN ADMIN ----------

// USER ROUTES  ---------------------------------------------

// @route GET /api/users/
// @desc  Renders The Index/Login Reg Page
router.get("/", function (req, res) {
  // localStorage.clear();
  res.render("index");
});

// @route GET /blog
// @desc  Renders The Index/Login Reg Page
router.get("/blog-page", function (req, res) {
  res.render("blog");
});

// @route GET /products
// @desc  Renders Products
router.get("/api/products", function (req, res) {
  if (req.session.user_id) {
    const tempUser = {
      name: req.session.user_name,
      _id: req.session.user_id,
    };
    Item.find()
      .sort({ created_at: -1 })
      .then((items) => {
        if (items && items.length > 0) {
          console.log("FoundItems!");
          // req.flash("error", "Found Items!");
          res.render("products", {
            items: items,
            msg: "Grabbed Available Items!",
            user: tempUser,
          });
        } else {
          console.log("No Items!");
          req.flash("error", "There Are NO Items!");
          res.render("products", {
            items: null,
            user: tempUser,
          });
        }
      });
  } else {
    console.log("YOU ARE NOT LOGGED IN!");
    req.flash("error", "NOTE - MUST BE LOGGED IN TO PURCHASE!");
    Item.find()
      .sort({ created_at: -1 })
      .then((items) => {
        if (items && items.length > 0) {
          console.log("FoundItems!");
          // req.flash("error", "Found Items!");
          res.render("products", {
            items: items,
            msg: "Grabbed Available Items!",
            user: null,
          });
        } else {
          console.log("No Items!");
          req.flash("error", "There Are NO Items!");
          res.render("products", {
            items: null,
            user: null,
          });
        }
      });
  }
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
router.get("/register-page", (req, res) => {
  res.render("register");
});

// @route GET /login-page
// @desc  Renders The Login Page
router.get("/login-page", (req, res) => {
  // if (
  //   localStorage.superuser_name != null ||
  //   localStorage.superuser_name != undefined
  // ) {
  //   // localStorage.clear();
  // }
  res.render("login");
});

// @route GET /about-page
// @desc  Renders The About Page
router.get("/about-page", (req, res) => {
  res.render("about");
});

// @route GET /contact-page
// @desc  Renders The Contact Page
router.get("/contact-page", (req, res) => {
  res.render("contact");
});

// @route GET /cart
// @desc  Renders TCart Example
router.get("/cart-page", (req, res) => {
  res.render("cart");
});

// @route POST /upload
// @desc  Uploads image to server/local-storage
router.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      // Validaition for certain image limitations: Size, And Images ONLY:
      if (err.code === "LIMIT_FILE_SIZE") {
        console.log("Image to big!");
        req.flash("error", "Image Size To Big! 1 MB Maximum!");
        res.redirect("/edit-profile");
      } else {
        console.log("Images Only!", err);
        req.flash("error", "Images Only!");
        res.redirect("/edit-profile");
      }
    } else if (req.file == undefined) {
      console.log("hitting here under undefined");
      req.flash("error", "No File Selected!");
      res.redirect("/edit-profile");
    } else {
      // Check if user is loging in, if not re-route to root:
      if (req.session.user_id) {
        // Query by ID:
        User.findOne(
          { _id: new ObjectId(req.session.user_id) },
          function (err, user) {
            if (err) {
              req.flash("error", "Must be logged in!");
              res.redirect("/");
            } else {
              // Destructuring, pulling data from req.body:
              // HERE 10-30W
              const { name, email, nickname, img } = user;
              // Creating new object with updated user fields:
              const updatedUser = {
                name, 
                email, 
                nickname,
                img: `uploads/${req.file.filename}`, // Declaring path to uploaded image:
              };

              // console.log("Updated User Image: ", updatedUser);
              // Overriding push to Mongo db, overwritting currnt data and replacing with new updated object:
              User.updateOne(
                { _id: new ObjectId(req.session.user_id) },
                { $set: updatedUser },
                (error, result) => {
                  if (error) {
                    // return res.status(500).send(error);
                    console.log("Failed to upload image... Error: ", error);
                    req.flash("error", "Failed to upload image"); // FLash error:
                    return res.redirect("/edit-profile"); // Redirect Edit Profile
                  }
                  console.log("Successfully Updated!");
                  // Render Profile page with updated User Info:
                  return res.render("profile", {
                    user: updatedUser,
                    msg: "Image Successfully Updated!",
                  });
                }
              );
            }
          }
        );
      }
    }
  });
});

// @route GET /profile
// @desc  Renders The Profile Page
router.get("/profile-page", (req, res) => {
  if (req.session.user_id) {
    // Query DB for User by ID:
    User.findOne({ _id: req.session.user_id }, function (err, user) {
      if (err) {
        // If not found, User not logged in:
        req.flash("error", "Must be logged in!"); // Flash Error msg
        res.redirect("/login-page"); // Redirect Login page
      } else {
        // Else User Found, Render Profile page with user data:
        res.render("profile", { user: user });
      }
    });
  } else {
    // else User IS NOT logged in or registered, reroute to root:
    req.flash("error", "Must be logged in!"); // Flash error
    res.redirect("/login-page"); // Redirect to Login page
  }
});

// @route GET /edit-profile
// @desc  Renders The Edit profile Page
router.get("/edit-profile", (req, res) => {
  if (req.session.user_id) {
    // Query DB For User by ID for current data:
    User.findOne({ _id: req.session.user_id }, function (err, user) {
      if (err) {
        req.flash("error", "Must be logged in!"); // Flash error
        res.redirect("/login-page");
      } else {
        // Render Edit Profile page while sending current User Data:
        res.render("edit-profile", { user: user, msg: "Edit YOUR Profile!" });
      }
    });
  } else {
    // else User isnt loggedin or registered:
    req.flash("error", "Must be logged in!");
    res.redirect("/login-page");
  }
});

// @route POST /update-profile
// @desc  Form To Add Extended User Info
router.post("/update-profile", (req, res) => {
  if (req.session.user_id) {
    User.findOne(
      { _id: new ObjectId(req.session.user_id) },
      function (err, user) {
        if (err) {
          req.flash("error", "Must be logged in!");
          res.redirect("/login-page");
        } else {
          // Destructuring, pulling data from the querried User data:
          const { email, img, premium_credits } = user;
          // Destructuring, pulling data from the req.body(FORM):
          const { name, zipcode, nickname } = req.body;
          // Creating user object for failed update:
          const oldData = {
            email,
            img,
            premium_credits,
          };
          // Create new object with updated User Fields:
          const updatedUser = {
            name,
            email,
            zipcode,
            nickname,
            premium_credits,
            img,
          };
          // Simple Validations: NOTE All validations and inputs for nearly every user Field, commented out as it wasnt needed. I left incase we may want to change that
          if (!name || name === "") {
            console.log("Name Blank");
            req.flash("error", "Please Enter Your Name!");
            res.redirect("/edit-profile");
          } else if (!nickname || nickname === "") {
            console.log("Nickname Blank");
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
          } else if (!zipcode || zipcode === "") {
            console.log("zipcode Blank");
            req.flash("error", "Please Enter your Zipcode!");
            res.redirect("/edit-profile");
          } else if (!zipREGEX.test(zipcode)) {
            console.log("Zipcode Is Invalid");
            req.flash("error", "Please Enter A Valid Zipcode");
            res.redirect("/edit-profile");
          } else {
            console.log("Updated User Info: ", updatedUser);
            // Override current User data with new Object:
            User.updateOne(
              { _id: new ObjectId(req.session.user_id) },
              { $set: updatedUser },
              (error, result) => {
                if (!result) {
                  // If the result failed, then flash error and re-route to Profile page:
                  console.log("Failed to update Profile Info.");
                  req.flash("error", "Failed To Update Profile Info");
                  return res.render("profile", {
                    user: oldData,
                    msg: "Profile Unfortunately Failed To Update",
                  });
                }
                console.log("Successfully Updated!");
                return res.render("profile", {
                  user: updatedUser,
                  msg: "Profile Successfully Updated! THANK YOU!",
                });
              }
            );
          }
        }
      }
    );
  }
});

// @route GET /login route render
// @desc  Renders The Login Route if someone were to type it in manually in the URL Page
router.get("/login", (req, res) => {
  if (req.session.user_id) {
    // Query DB For User by ID for current data:
    User.findOne({ _id: req.session.user_id }, function (err, user) {
      if (err) {
        req.flash("error", "Must be logged in!"); // Flash error
        res.redirect("/login-page");
      } else {
        // Render profile page:
        req.flash("success", "Welcome Back " + req.session.user_name + "!");
        res.render("profile", { user: user, msg: "Edit YOUR Profile!" });
      }
    });
  } else {
    // else User isnt loggedin or registered:
    req.flash("error", "Must be logged in!");
    res.redirect("/login-page");
  }
});

// NOTE HERE! LEFT OFF ON LOGIN HERE!
// @route  POST /login
// @desc  For Logging In A User
router.post("/login", (req, res) => {
  console.log("hitting here login");
  // console.log("TEST REQ BODY: "+ req.body.emailLog);
  const { emailLog, passwordLog } = req.body;
  const emailLower = emailLog.toLowerCase();
  // console.log("CURRENT GRAB OF DATA EMAIL: " + emailLower);
  // console.log("CURRENT GRAB OF DATA PASS: " + passwordLog);

  // Simple validation:
  if (!emailLog || !passwordLog) {
    console.log("Please Enter All Login Fields!");
    req.flash("error", "Please Enter All Login Fields");
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
      } else {
        if (user) {
          // User was found
          console.log("found user with email " + user.email + " Logging in...");
          // Comparing Password with stored hash vs user input:
          bcrypt.compare(passwordLog, user.password, function (err, result) {
            if (result) {
              // If Password is a match, then throw user ID into session and route to profile page:

              req.session.user_id = user._id; // Throwing ID into session:
              req.session.user_name = user.name;
              req.session.user_nickname = user.nickname;
              req.session.user_img = user.img;
              req.session.user_email = user.email;
              
              // req.session.user_image = user.image;
              // Put Name and ID as well into local storage:
              localStorage.setItem("user_name", user.name);
              localStorage.setItem("user_nickname", user.nickname);
              localStorage.setItem("user_id", user._id);
              localStorage.setItem("user_image", user.img);
              localStorage.setItem("user_email", user.email);

              res.render("profile", {
                user: user,
                msg: "Successfully Logged in! Welcome Back!",
              });
              req.flash("success", "Welcome Back!");
            } else {
              // Else passwords did not match with stored hash:
              console.log("Wrong Password!");
              req.flash("error", "Wrong Password!");
              res.redirect("/login-page");
            }
          });
        } else {
          // User not found
          console.log("User Not Found!");
          req.flash("error", "User Not found");
          res.redirect("/login-page");
        }
      }
    });
  }
});

// @route GET /success
// @desc  The TypeCast Official Logged In Home Page - *NOTE* Old, No longer being used but left it here for now:
router.get("/success", function (req, res) {
  if (req.session.user_id) {
    User.findOne({ _id: req.session.user_id }, function (err, user) {
      if (err) {
        req.flash("error", "Must be logged in!");
        res.redirect("/");
      } else {
        res.render("profile", { user: user });
      }
    });
  } else {
    req.flash("error", "Must be logged in!");
    res.redirect("/");
  }
});









// // @route POST /logout
// // @desc  Logout A User
// router.post("/logout", (req, res) => {
//   req.session.user_id = null;
//   res.redirect("/")
// });

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
