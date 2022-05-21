const express = require("express");
const Router = express.Router();
const { protect , restrictTo } = require("../controller/authController");
const viewController = require("./../controller/viewController");

// Router.get("/", viewController.frontend);
Router.get("/", viewController.signin);
Router.get("/signup", viewController.signup);
Router.get("/changePassword", viewController.changePassword)

// Router.use(authController.protect);
Router.get("/profile", protect, viewController.profile);
Router.get("/products", protect, viewController.products);
Router.get("/dashboard", protect, viewController.dashboard);
Router.get("/addproduct", protect, viewController.addproducts);
Router.get("/editproduct", protect, viewController.editProduct);
Router.get("/links", protect, viewController.affiliate)
Router.get("/users", protect, restrictTo("admin"), viewController.users);
Router.get("/addsubcategory", protect, restrictTo("admin"), viewController.addSubcategory);
Router.get("/subcategory", protect, restrictTo("admin"), viewController.subcategory);
Router.get("/editsubcategory", protect, restrictTo("admin"), viewController.editsubcategory);
Router.get("/home", protect, restrictTo("admin"), viewController.home);
Router.get("/category", protect, restrictTo("admin"), viewController.category);
Router.get("/reviews", protect, restrictTo("admin"), viewController.reviews)
Router.get("/getReviews", protect, restrictTo("admin"), viewController.getReviews);
Router.get("/addslider", protect, restrictTo("admin"), viewController.addslider);
Router.get("/addcategory", protect, restrictTo("admin"), viewController.addcategory);
Router.get("/getVisitors", protect, restrictTo("admin"), viewController.getVisitors)
Router.get("/visitors", protect, restrictTo("admin"), viewController.visitors);
Router.get("/downloads", protect, restrictTo("admin"), viewController.downloads);
Router.get("/transections", protect, restrictTo("admin"), viewController.transections);
Router.get("/success-transections", protect, restrictTo("admin"), viewController.successTransections);

module.exports = Router;
