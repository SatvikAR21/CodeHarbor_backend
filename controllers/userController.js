const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const {MongoClient, ReturnDocument} = require("mongodb");
const dotenv = require("dotenv");
var ObjectId = require("mongodb").ObjectId;


dotenv.config();
const uri = process.env.MONGODB_URI;

let client;

async function connectClient() {
  if (!client) {
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  await client.connect();
}



async function getAllUsers (req,res)
{
  try{
    await connectClient();
    const db = client.db("CodeHarbor");
    const usersCollection = db.collection("users");

    const users = await usersCollection.find({}).toArray();
    res.json(users);

  }catch(err){
    console.error("Error during fetching : ", err.message);
    res.status(500).send("Server error !");
  }
};

async function signup(req, res) {
  const { username, password, email } = req.body;
  try {
    await connectClient();
    const db = client.db("CodeHarbor");
    const usersCollection = db.collection("users"); // ✅ fixed

    const user = await usersCollection.findOne({ username });
    if (user) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username,
      password: hashedPassword,
      email,
      repositories: [],
      followedUsers: [],
      starRepos: [],
    };

    const result = await usersCollection.insertOne(newUser);

    const token = jwt.sign(
      { id: result.insertedId }, // ✅ fixed
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Error during signup:", err.message);
    res.status(500).send("Server error");
  }
};

async function login(req, res)
{
  const {email, password}= req.body;
  try{
    await connectClient();
    const db = client.db("CodeHarbor");
    const usersCollection= db.collection("users");

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch)
    {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({id:user._id}, process.env.JWT_SECRET_KEY, {expiresIn:"1h"});
    res.json({token, userId:user._id});
  }catch(err){
    console.error("Error during the login : ", err.message);
    res.status(500).send("Serever error!");
  }
};

async function getUserProfile(req, res) {
  try {
    await connectClient();
    const db = client.db("CodeHarbor");
    const usersCollection = db.collection("users");

    const userId = req.params.id; // <-- take ID from URL

    // validate ObjectId
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

  res.send(user);
  } catch (err) {
    console.error("Error during fetching user profile:", err.message);
    res.status(500).send("Server error!");
  }
}
async function updateUserProfile(req, res) {
  const currentID = req.params.id;
  const { email, password } = req.body;

  try {
    await connectClient();
    const db = client.db("CodeHarbor");
    const usersCollection = db.collection("users");

    // prepare fields to update
    let updateFields = {};
    if (email) updateFields.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.password = hashedPassword;
    }

    // detect whether _id is ObjectId or String in DB
    let query = { _id: currentID }; // default (string _id)
    if (ObjectId.isValid(currentID)) {
      // try both ways just in case
      query = {
        $or: [
          { _id: currentID }, // string match
          { _id: new ObjectId(currentID) } // ObjectId match
        ]
      };
    }

    const result = await usersCollection.findOneAndUpdate(
      query,
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result.value) {
      return res.status(404).json({ message: "User not found!" });
    }

    return res.status(200).json({ message: "Profile updated!" });

  } catch (err) {
    console.error("Error during updating:", err.message);
    return res.status(500).send("Server error!");
  }
};

async function deleteUserProfile (req, res)
{
  const currentID = req.params.id;

  try{
    await connectClient();
    const db = client.db("CodeHarbor");
    const usersCollection = db.collection("users");

    const result = await usersCollection.deleteOne({
      _id: new ObjectId(currentID),
    });

    if(result.deleteCount==0)
    {
      return res.status(404).json({message: "User not found"});
    }
    res.json({message: "User Profile Deleted!"});
  }catch(err){
    console.log("Error during deleting : ", err.message);
    res.status(500).send("Server error!");
  }
};

module.exports = {
  getAllUsers,
  signup,
  login,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
};
