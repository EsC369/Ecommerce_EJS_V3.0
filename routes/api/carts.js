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

// Test
router.get('/test', (req, res) => res.json({ success: 'Cart API Works!' }));

// @ desc    Kill Bcakend Session:
// @ route    GET api/carts/kill
// @ access   Public
router.get("/kill", (req, res) => {
  // console.log("Current Session ID: ", req.session.cart_id)
  // Check for session first:
  if (req.session) {
    req.session.destroy()
    // console.log("BACKEND SESSION ENDING")
    console.log("Backend Session Removed!")
    // wipeCollection()
  } else {
    return res.status(404).json({ message: "No Backend Session" });
  }
})

// @route GET /cart
// @desc  Renders TCart Example
router.get("/cart-page", (req, res) => {
  res.render("cart");
});

// @ desc    Get most recent cart Get most recent cart by Session:
// @ route    GET api/carts
// @ access   Public
router.get("/", (req, res) => {
  console.log("HITTING HERE! API/CARTS!");
  if (!req.session.user_id) {
    console.log(" HERE ASDKASDKLASDSK: ")
    req.flash("error", "Sorry, You Must Be Login To Create A Cart");
    res.redirect("/login-page");
  } else {
    const tempUser = {
      name: req.session.user_name,
      img: req.session.user_img,
      _id: req.session.user_id,
      email: req.session.email
    }
    if (req.session.cart_id) {
      let cartID = req.session.cart_id;


      User.findOne({ _id: req.session.user_id }, function (err, user) {
        if (err) {
          req.flash("error", "Must be logged in!"); // Flash error
          res.redirect("/login-page");
        } else {

          console.log("Found Cart!");

          Cart.findById(cartID)
            .then(cart => res.render("cart", { user: user, cart: cart, msg: "Your Current Cart!" }))
            .catch(err => res.render("profile", { message: 'Error', error: err }));
          // Render profile page:

        }
      });
    } else {
      const tempCart = {
        products: []
      }
      // else User isnt loggedin or registered:
      console.log("No cart! No Items in cart!22 ")
      req.flash("error", "No Items In Cart!");
      res.render("cart", { cart: tempCart, user: tempUser, msg: "No Items In YOur Cart! " });
    }
  }




});

// @ desc    Create A New cart
// @ route    POST api/carts
// @ access   Public
router.post("/", (req, res) => {
  console.log("Hitting here! Carts!")
  console.log("USER??    " + req.session.user_id)
  if (!req.session.user_id) {
    req.flash("error", "Sorry, You Must Be Logged In To Add To Cart...")
    res.redirect("/login-page");

  }
  // Check if cartID is in session, if so, then push product into already created cart:
  if (req.session.cart_id) {
    console.log("hitting here Foudn existing cart!");
    // console.log("Hitting session", req.body)
    const { price, item_id, name, _id, quantity, total, desiredQuantity, description, image, qtySold } = req.body;
    console.log(" WHATS ION THE REQ.BODY?!" + price, item_id, name, quantity, total, desiredQuantity, description, image, qtySold)

    Cart.findById(req.session.cart_id)
      .then(cart => {
        const newProduct = {
          _id: item_id,
          desiredQuantity: desiredQuantity,
          name: name,
          price: price,
          total: parseInt(desiredQuantity * price),
          quantity: quantity,
          description: description,
          image: image,
          qtySold: qtySold
        }
        // Add to products array:
        cart.products.push(newProduct);
        const tempUser = {
          name: req.session.user_name,
          img: req.session.user_img,
          _id: req.session.user_id,
          email: req.session.email
        }
        console.log("CONNECTING USER: " + tempUser);
        // Save

        cart.save((err) => {
          // Save new User into DB:
          if (err) {
            // If error:
            console.log("Error Saving Into Databse! - Error Message: " + err);
            req.flash("error", "Error Saving Into Databse!");
            return res.redirect("/profile");
          } else {
            console.log("Successfully Added Item!");
            req.flash("success", "Created Item Successfully!");

            // IN here later, add functionality to query dTAbase for all items GAin,, and pass to page render

            //Grab ITEMS again.. to pass back to the
            // res.render("admin/admin-show-items", {
            //   superuser: tempUser,
            //   msg: "Item Successfully Created!",
            // });
            res.render("cart", { user: tempUser, cart: cart, message: "successfully added item to cart!" });
            // res.render("/admin/admin-show-items", { superuser: tempUser, msg: "Successfully Created Item!" });
          }
        });



      });
    // Return statement below to stop the condition:
    return
  } else { // Else, cart doesnt exist, create new cart and populate its first products array with inputted product info:
    // const { price, _id, name, quantity, total, desiredQuantity } = req.body.products[0]
    const { price, _id, item_id, name, quantity, total, desiredQuantity, description, image, qtySold } = req.body
    console.log("hitting here creating cartt");
    console.log(" WHATS ION THE REQ.BODY?!" + price, _id, item_id, name, quantity, total, desiredQuantity, description, image, qtySold)
    // CreateCart:

    const newCart = new Cart({
      products: [
        {
          _id: item_id,
          desiredQuantity: desiredQuantity,
          name: name,
          price: price,
          total: parseInt(desiredQuantity * price),
          quantity: quantity,
          description: description,
          image: image,
          qtySold: qtySold
        }
      ],

    });
    const tempUser = {
      name: req.session.user_name,
      img: req.session.user_img,
      _id: req.session.user_id
    }
    console.log("CONNECTING USER: " + tempUser.name, tempUser._id);
    req.session.cart_id = newCart._id;
    // SaveCart to DB:
    // Store cart ID inside of session:

    console.log("New Cart Session Created :", req.session.cart_id)



    newCart.save((err) => {
      // Save new User into DB:
      if (err) {
        // If error:
        console.log("Error Saving Into Databse! - Error Message: " + err);
        req.flash("error", "Error Saving Into Databse!");
        return res.redirect("/profile-page");
      } else {
        console.log("Successfully Added Item!");
        req.flash("success", "Created Item Successfully!");

        // IN here later, add functionality to query dTAbase for all items GAin,, and pass to page render

        //Grab ITEMS again.. to pass back to the
        // res.render("admin/admin-show-items", {
        //   superuser: tempUser,
        //   msg: "Item Successfully Created!",
        // });
        res.render("cart", { user: tempUser, cart: newCart, message: "Your Current Cart!" });
        // res.render("/admin/admin-show-items", { superuser: tempUser, msg: "Successfully Created Item!" });
      }
    });

  }
});

// @ desc    Cart_checkout
// @ route    POST api/carts/cart-checkout
// @ access   Public
router.post("/cart-checkout", (req, res) => {
  console.log("Hitting here! Carts!")
  var grandTotal = 0;

  if (!req.session.user_id) {
    req.flash("error", "Sorry, You Must Be Logged In To Add To Cart...")
    res.redirect("/login-page");

  }
  // var items = [];

  if (req.session.cart_id) {

    // console.log("Hitting session", req.body)
    // const { price, item_id, name, _id, quantity, total, desiredQuantity, description, image, qtySold } = req.body;
    // console.log(" WHATS ION THE REQ.BODY?!"+ price, item_id, name, quantity, total, desiredQuantity, description, image, qtySold)

    const tempUser = {
      name: req.session.user_name,
      img: req.session.user_img,
      _id: req.session.user_id,
      email: req.session.user_email
    }

    Cart.findById(req.session.cart_id)
      .then(cart => {
        // console.log("test here proiducts length"+ cart.products.length );

        for (var i = 0; i < cart.products.length; i++) {
          grandTotal += (cart.products[i].price * cart.products[i].desiredQuantity);
          // items.push({ _id: cart.products[i]._id, quantity: cart.products[i].desiredQuantity })

        }
        grandTotal = grandTotal.toFixed(2) * 100;
        console.log("TEST HERE! GRAND TOTAL: " + grandTotal);
        req.session.user_grandTotal = grandTotal;
        req.session.user_products = cart.products;
        console.log("CART ID! "+ cart._id);
        req.session.cart_id = cart._id
        res.render("cart-checkout", { cart, user: tempUser, stripePublicKey, grandTotal })
      });
    // Add to products array:



  } else {
    req.flash("error", "Cart Is Empty!");
    res.redirect("/api/carts");
  }

});





// // @ route    POST api/carts/charge
// // @ desc     Confirm Purchase With Stripe:
// // @ access   Public
// router.post("/charge", async (req, res) => {
//     try {
//       let {status} = await stripe.charges.create({
//         amount: 200,
//         currency: "usd",
//         description: "An example charge2",
//         source: req.body
//       });

//       res.json({status});
//     } catch (err) {
//       console.log(err);
//       res.status(500).end();
//     }
//   });




// @ route    POST api/carts/checkout
// @ desc     Confirm Purchase With Stripe:
// @ access   Public
// router.post("/checkout", async (req, res) => {
router.post("/create-checkout-session", async (req, res) => {
  console.log("HITTING /checkout!");
  console.log("STRIPE PUBLIC KEY! TEST: " + stripePublicKey);
  console.log("TETS GRAND TOTAL PASSING DATA: " + req.session.user_grandTotal);

  if (req.session.user_id) {
    const tempUser = {
      name: req.session.user_name,
      _id: req.session.user_id,
      img: req.session.user_img,
      email: req.session.user_email
    }
    console.log("HITTING FOUND USER");

    if (req.session.user_products) {

      console.log("TEST CART! " + JSON.stringify(req.session.cart_id));
      // console.debug("cart hgere!@: "+ req.session.user_products[0].name)


      // const body = JSON.stringify({
      //   items: [
      //     { _id: 1, quantity: 2 },
      //     { _id: 2, quantity: 3 }
      //   ]
      // })
      const items = req.session.user_products;
      // const itemsObj = { ...req.session.user_products }; // converting items array into an object 

      // for(var i=0;i< req.session.user_products.length;i++){
      //   // grandTotal += (req.session.user_products[i].price * req.session.user_products[i].desiredQuantity);
      //   items.push({_id: req.session.user_products[i]._id, quantity: req.session.user_products[i].desiredQuantity})
      // }
      // _--------------------------------------
      var paidInFull = null;
      // RIGHT HERE W ENEED TO PUT A STRIPE CARD CHECK
      console.log("RIGHT BEFORE CHECKOUT");
      // const token = await stripe.tokens.create({
      const session = await stripe.checkout.sessions.create({
        line_items: items.map(item => {
          // const storeItem = items.get(item._id)

          return {
            price_data: {
              currency: "usd",
              product_data: {
                name: item.name
              },
              unit_amount: (item.price * 100)
            },
            quantity: item.desiredQuantity
          }
          
        }),
        mode: 'payment',
        success_url: 'http://localhost:5000/api/orders/all-orders',
        cancel_url: 'http://localhost:5000/cancel',
      });

      // console.log("SESSION: "+ JSON.stringify(session))
      // Cancel Cart Session! And Cart Database! 
      

      


      //   KEEP FOR PULLING INFO FROM FORM!------------------
      console.log("paid in full? "+ paidInFull);
      console.log("----------------------------");

      var shipping_info = {
        address_line_1: req.body.address_line1,
        address_line_2: req.body.address_line2,
        address_city: req.body.address_city,
        address_state: req.body.address_state,
        address_zip: req.body.address_zip,
        address_country: req.body.address_country
      };


      console.log("OUTPUT OF Shipping info: " + JSON.stringify(shipping_info));
      console.log("----------------------");

      //  here create order! :

      // const newAddress = req.session.address1 + " " + req.session.address2 + " " + req.session.state.toUpperCase() + ". " + req.session.zipCode;
      const newOrder = new Order({
        firstName: req.body.first_name,
        lastName: req.body.last_name,
        email: req.session.user_email,
        shipping_info: shipping_info,
        total: req.session.user_grandTotal,
        orderDetails: items,
        status: "Order In",
      });
      console.log("New order:", newOrder);


      // Save Order to DB:
      newOrder.save((err, result) => {
          if(err){
              // return res.status(400).json({ message: "Error", error: err })
              console.log("error: "+ err);
          }else{
              console.log("HERE TEST IN ORDERS SAVE RES", result._id, "date :", result.date)
              // setOrdSession(result._id, result.date)
              // return res.status(200).json({ message: "success", data: result })
          }
      })



      console.log("CLEARING CART!");

      req.session.cart = null;
      req.session.user_products = null;
      req.session.user_grandTotal = null;
      // CLEAR CART!:
      await Cart.findById(req.session.cart_id)
        .then(cart => cart.remove((err) => {

          // Save new User into DB:
          if (err) {
            // If error:
            console.log("Error Removign Cart From DB... " + err);
            req.flash("error", "Error Removing Into Databse!");
            return res.redirect("/profile-page");
          } else {
            console.log("Successfully Deleted Cart!");

            req.session.cart_id = null;


            // const tempCart = {
            //   products: []
            // }
            req.flash("success", "Successfully Purchased Items!");

            //  Redirect to success page: 
            res.redirect(303, session.url);
          }
        }));
    }
  }
});










      







// @ route    POST api/carts/:id
// @ desc     Delete Cart by ID:
// @ access   Public
router.post("/:id", (req, res) => {
  if (req.session.user_id) {



    Cart.findById(req.session.cart_id)
      .then(cart => cart.remove((err) => {

        // Save new User into DB:
        if (err) {
          // If error:
          console.log("Error Removign Cart From DB... " + err);
          req.flash("error", "Error Removing Into Databse!");
          return res.redirect("/profile-page");
        } else {
          console.log("Successfully Deleted Cart!");

          req.session.cart_id = null;

          // IN here later, add functionality to query dTAbase for all items GAin,, and pass to page render

          //Grab ITEMS again.. to pass back to the
          // res.render("admin/admin-show-items", {
          //   superuser: tempUser,
          //   msg: "Item Successfully Created!",
          // });
          tempUser = {
            name: req.session.user_name,
            img: "/" + req.session.user_img,
            _id: req.session.user_id
          }
          console.log("hitting here deleting cart: " + tempUser.img)
          const tempCart = {
            products: []
          }
          req.flash("success", "Successfully Deleted Cart!");
          res.render("cart", { cart: tempCart, user: tempUser, message: "Successfully Deleted Cart" });
          // res.render("/admin/admin-show-items", { superuser: tempUser, msg: "Successfully Created Item!" });
        }
      }));
  } else {
    req.flash("error", "YOU Must be logged in to add to your cart");
    res.redirect("/login-page");
  }

})

// @ route    POST api/carts/delete/:id
// @ desc    Delete a product within the cart:
// @ access   Public
router.post("/delete/:id", (req, res) => {
  console.log("TEST HER EIN BACKEND Item id test? :  ", req.body.item_id);
  Cart.findById(req.session.cart_id)
    .then(cart => {
      console.log("hitting here found cart!");
      // Check to see if product with ID
      if (cart.products.filter(product => product._id.toString() === req.body.item_id).length === 0) {

        req.flash("error", "Couldnt Find Item");
        return res.redirect("/profile-page");

      }

      const tempUser = {
        name: req.session.user_name,
        img: req.session.user_img,
        _id: req.session.user_id
      }

      // Get remove index
      const removeIndex = cart.products
        .map(product => product._id.toString())
        .indexOf(req.body.item_id);

      console.log("HELLOW! Here is new cart id! : " + req.body.item_id)
      // Splice product/item out of array
      cart.products.splice(removeIndex, 1);
      req.flash("success", "Successfully deleted item!");

      // Save cart:
      cart.save().then(cart => res.render("cart", { user: tempUser, cart, message: "Your Current Cart!" }));

    })
    .catch(err => res.redirect("/profile-page"));
  console.log("HITTING ERROR! CANT SAVE!")
}
);

// // @ route    GET api/carts/ID
// // @ desc    Show one cart by ID
// // @ access   Private
// router.get("/:id", (req, res) => {
//     Cart.findById(req.params.id, (err, cart) => {
//         if (err) {
//             return res.json({ message: "Error", error: "I.D. doesn't exist..." });
//         }
//         else {
//             // extra check as sometimes cart will send a success with null data as cart:
//             if (cart === null) {
//                 return res.json({ message: "Error", error: "I.D. doesn't exist..." });
//             }
//             return res.json({ message: "Success", data: cart });
//         }
//     });
// });

module.exports = router;