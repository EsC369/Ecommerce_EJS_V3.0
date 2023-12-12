
const express = require("express");
const router = express.Router();
// const uuid = require("uuid/v4");
const app = express();
// Stripe Middleware:
// const uuid = require("uuid/v4");
// Stripe Middleware:
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;
const stripe = require("stripe")(stripeSecretKey);
// app.use(require("body-parser").text());




//*NOTE* This wipes all carts from DB every X time:
// router.get("/killCarts", (req, res) => {
//     collection.drop().then(console.log("Cart Collections DELETED!"))
//     .catch(console.log("Failed to drop Cart Collection..."))
// })

// cart Model:
const Cart = require("../../models/Cart");
const Order = require("../../models/Order");

// // @ route    GET api/orders/single-order
// // @ desc    Show one Order by ID
// // @ access   Private
router.get("/single-order/:id", (req, res) => {
    console.log("TEST ORDER ID: "+ req.params.id)
    Order.findById(req.params.id).then((order) => {
        if (order) {
  
          console.log("TEST HERE! FOUDN ORDER!: ");

          const tempUser ={
            name: req.session.user_name,
            _id: req.session.user_id,
            img: req.session.user_img,
            email: req.session.user_email
        }
          // req.flash("error", "Found order");
          console.log("order: "+ JSON.stringify(order));
          return res.render("single-order", {
            superuser: tempUser,
            order: order, // DONT BE FOOLED! THIS IS order! NOT orderS! SINGLE! FOr future preference when rendering Single View Of Said newly Created Item:s
          });
        } else {
          console.log("couldnt grab ORDER");
          req.flash("error", "Couldnt find ORDER!");
          res.redirect("/");
        }
    })
});

// // @ route    GET api/orders/all-orders
// // @ desc    Show All Orders
// // @ access   Private
router.get("/all-orders", (req, res) => {
    console.log("HITTING HERE! ORDERS!!! email is "+ req.session.user_email);
    if(req.session.user_email){
        const tempUser ={
            name: req.session.user_name,
            _id: req.session.user_id,
            img: req.session.user_img,
         
            email: req.session.user_email
        }
        
        Order.find({email: req.session.user_email}, function (err, orders) {
            if(err){
                console.log("error grabbing orders: "+ err);
                req.flash("error", "FAILED TO GRAB Orders");
                res.redirect("profile");
            }else{
                
             if(orders.length > 0 ){
                   // orders.sort({ date: -1 });
                   console.log("Hitting here orders are greater than 1")
                   orders.sort((objA, objB) => Number(objA.date) - Number(objB.date));
                   res.render("show-orders", {orders: orders, user: tempUser, msg: 'Grabbed Available Orders'})
             }else{
                req.flash("success", "No Orders");
                res.render("show-orders", {orders: {}, user: tempUser, msg: 'No Orders!'})
             }
                // console.log("Orders HERE!: "+orders);
            }
        // .sort({ date: -1 })
        // .then(orders => res.render("show-orders", {orders: orders, user: tempUser, msg: 'Grabbed Available Orders'})).then(console.log("ORDERS: "+ orders))
        // .catch(err => res.render("index", {msg: 'FAILED TO GRAB Orders'}))
        req.flash("error", "No Orders!");
        })
        
    }else{
        console.log("FAILED TO GRAB Orders");
        req.flash("error", "FAILED TO GRAB Orders");
    }
        
});


module.exports = router;