const express = require("express");
const userController = require("../controllers/userController");

const userRouter = express.Router();

// ✅ Auth routes
userRouter.post("/signup", userController.signup);   // Sign up new user
userRouter.post("/login", userController.login);     // Login existing user

// ✅ User profile routes
userRouter.get("/all", userController.getAllUsers); // Fetch all users
userRouter.get("/:id", userController.getUserProfile); // Get profile by user ID
userRouter.put("/:id", userController.updateUserProfile); // Update user profile
userRouter.delete("/:id", userController.deleteUserProfile); // Delete user

module.exports = userRouter;
