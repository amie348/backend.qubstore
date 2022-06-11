const express = require("express");
const Router = express.Router();
const authController = require("../controller/authController");
const userController = require("./../controller/userController");
// this comment is for heroku casing error

Router.post("/signup", authController.signup);
Router.post("/signin", authController.signin);
Router.get("/logout", authController.logout);

Router.post("/sendCode", authController.sendCode);
Router.post("/resetCode", authController.resetPasswordCode);
Router.get("/links", authController.protect,userController.getLinks);
Router.post("/createLinks", authController.protect, userController.createLink);
Router.post("/ResetPassword",authController.ChangePassword);
Router.post("/getUsers",  authController.protect, authController.restrictTo("admin"),userController.getUsers)
Router.patch("/update-status/:userId", authController.protect, authController.restrictTo("admin"), userController.updateStatus)
Router.delete("/delete-user/:userId", authController.protect, authController.restrictTo("admin"), userController.deleteUserById)


Router.delete("/deleteLink",  userController.deleteLink);
Router.patch("/updatePassword", authController.protect,authController.updatePassword);
Router.patch("/updateMe", authController.protect, userController.updateMe);
Router.patch("/update", authController.protect, userController.update);
Router.patch("/addAccount", authController.protect, userController.addAccount);


Router.get("/me", authController.protect, userController.getMe);
Router.get("/getAll", authController.protect, authController.restrictTo("admin"), userController.getAllUsers);
Router.patch("/delete/:email",authController.protect, authController.restrictTo("admin"), userController.deleteUser);



module.exports = Router;