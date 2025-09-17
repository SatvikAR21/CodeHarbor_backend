const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");

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
  if (!client.topology?.isConnected()) {
    await client.connect();
  }
}

/**
 * GET /users
 */
async function getAllUsers(req, res) {
  try {
    await connectClient();
    const db = client.db("CodeHarbor");
    const usersCollection = db.collection("users");

    const users = await usersCollection.find({}).toArray();
    res.json(users);
  } catch (err) {
    console.error("Error during fetching:", err.message);
    res.status(500).send("Server error!");
  }
}

/**
 * POST /signup
 */
async function signup(req, res) {
  const { username, password, email } = req.body;

  try {
    await connectClient();
    const db = client.db("CodeHarbor");
    const usersCollection = db.collection("users");

    // Check if user already exists by email or username
    const existingUser = await usersCollection.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username,
      email,
      password: hashedPassword,
      repositories: [],
      followedUsers: [],
      starRepos: [],
    };

    const result = await usersCollection.insertOne(newUser);

    const token = jwt.sign(
      { id: result.insertedId },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token, userId: result.insertedId }); // ✅ send userId also
  } catch (err) {
    console.error("Error during signup:", err.message);
    res.status(500).send("Server error");
  }
}

/**
 * POST /login
 */
async function login(req, res) {
  const { email, password } = req.body;

  try {
    await connectClient();
    const db = client.db("CodeHarbor");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    res.json({ token, userId: user._id }); // ✅ align with frontend
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).send("Server error!");
  }
}

/**
 * GET /users/:id
 */
async function getUserProfile(req, res) {
  try {
    await connectClient();
    const db = client.db("CodeHarbor");
    const usersCollection = db.collection("users");

    const userId = req.params.id;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } } // hide password
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err.message);
    res.status(500).send("Server error!");
  }
}

/**
 * PUT /users/:id
 */
async function updateUserProfile(req, res) {
  const userId = req.params.id;
  const { email, password } = req.body;

  try {
    await connectClient();
    const db = client.db("CodeHarbor");
    const usersCollection = db.collection("users");

    let updateFields = {};
    if (email) updateFields.email = email;
    if (password) {
      updateFields.password = await bcrypt.hash(password, 10);
    }

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
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
}

/**
 * DELETE /users/:id
 */
async function deleteUserProfile(req, res) {
  const userId = req.params.id;

  try {
    await connectClient();
    const db = client.db("CodeHarbor");
    const usersCollection = db.collection("users");

    const result = await usersCollection.deleteOne({
      _id: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User Profile Deleted!" });
  } catch (err) {
    console.log("Error during deleting:", err.message);
    res.status(500).send("Server error!");
  }
}

module.exports = {
  getAllUsers,
  signup,
  login,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
};
