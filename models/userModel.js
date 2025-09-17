const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true, // removes spaces
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // normalize email
    },
    password: {
      type: String,
      required: true,
      minlength: 6, // basic validation
    },
    repositories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Repository",
      },
    ],
    followedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // ✅ not "Users"
      },
    ],
    starRepos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Repository",
      },
    ],
  },
  { timestamps: true } // adds createdAt & updatedAt
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
