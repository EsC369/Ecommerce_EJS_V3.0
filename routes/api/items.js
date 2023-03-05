// Library Imports:
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const path = require("path");
const nodemailer = require("nodemailer");
const ObjectId = require('mongodb').ObjectID;
const LocalStorage = require('node-localstorage').LocalStorage;
const dotenv = require('dotenv').config();

// Item Model:
const Item = require("../../models/Item");

// Variables:
const maxSize = 1 * 1024 * 1024; // for 1MB 
var desiredSaves = [];

// All Variables below here are for utilizing facebook login, CUrrently not being used/commented out:
const webpush = require("web-push")
const passport = require("passport");
const strategy = require("passport-facebook")

// ROUTES ---------------------------------------------

// @route GET /api/items
// @desc  Renders The Items
router.get("/api/items", function (req, res) {
    Item.find({})
      .then(items => {
        if (items) {
          console.log("No Items!")
          req.flash("error", "No Items!")
          return res.redirect("/");
        }
        res.render("products", {items: items, msg: 'Grabbed Available Items!'});
  });
});
  
// @route GET /blog
// @desc  Renders The Index/Login Reg Page
router.get("/api/create", function (req, res) {
    res.render("blog");
});
  
//     HERE------------



// @ desc    Get ALL items
// @ route    GET api/items
// @ access   Public
router.get("/", (req, res) => {
    Item.find({})
    .sort({ date: -1 })
    .then(items => res.render("products", {items: items, msg: 'Grabbed Available Items!'}))
    .catch(err => res.render("index", {msg: 'FAILED TO GRAB ITEMS!'}))
    req.flash("error", "FAILED TO GRAB ITEMS");
    // .then(items => res.json(items))
    // .catch(err => res.status(404).json({message: "Error", error: err}))
});

// @ desc    Create A New Item
// @ route    POST api/items
// @ access   Public
router.post("/", (req, res) => {

    const { name, description, quantity, price, image, qtySold } = req.body;
    // Create item:
    const newItem = new Item({
        name,
        description,
        price,
        quantity,
        image,
        qtySold
    });
    // Save item to DB:
    newItem.save().then(item => res.status(200).json(item))
    .catch(err => res.status(400).json({message: "Error", error: err}))
});

// @ route    POST api/items/:id
// @ desc    Delete a Item:
// @ access   Public
router.delete("/:id", (req, res) => {
    Item.findById(req.params.id)
        .then(item => item.remove().then(() => res.status(200).json({message: "Successfully Removed!"})))
        .catch(err => res.status(404).json({message: "Error", error: err}))
})

// @ route    PUT api/items/ID
// @ desc    Edit Item By ID Route
// @ access   Private
router.put("/:id", (req, res) => {
    // console.log("ID", req.params.id)
    Item.findById(req.params.id, (err, item) => {
        if (err) {
            res.json({ message: "Error", error: err });
        }
        else {
            // Weird way of doing so as usually entries wont even get this far, but if the entries are null, this will hit
            try {
                
                item.set(req.body)
            } catch{
                return res.status(400).json({ message: "Error", error: "One of the inputs is empty" })
            }

            item.save((err) => {
                if (err) {
                    res.status(400).json({ message: "Error", error: err });
                }
                else {
                    res.status(200).json({ message: "Success", data: item });
                }
            });
        }
    });
});

// @ route    GET api/items/ID
// @ desc    Show one item by ID
// @ access   Private
router.get("/:id", (req, res) => {
    Item.findById(req.params.id, (err, item) => {
        if (err) {
            res.json({ message: "Error", error: "ID doesn't exist..." });
        }
        else {
            res.json({ message: "Success", data: item });
        }
    });
});

module.exports = router;