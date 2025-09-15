const express = require("express");
const userController = require("../controllers/userController");

const userRouter = express.Router();

userRouter.get("/allUsers", userController.getAllUsers);
userRouter.post("/signup", userController.signup);         // ✅ should be POST
userRouter.post("/login", userController.login);           // ✅ should be POST
userRouter.get("/userProfile/:id", userController.getUserProfile);
userRouter.put("/updateProfile/:id", userController.updateUserProfile);  // ✅ should be PUT
userRouter.delete("/deleteProfile/:id", userController.deleteUserProfile); // ✅ should be DELETE

module.exports = userRouter;
