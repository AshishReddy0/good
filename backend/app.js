// ✅ Step 1: Import required packages
const express = require('express');         // Express for creating server and routes
const mongoose = require('mongoose');       // Mongoose for interacting with MongoDB
require('dotenv').config();                 // Load environment variables from .env

// ✅ Step 2: Initialize Express app
const app = express();                      // Create Express app instance
app.use(express.json());                    // Middleware to parse JSON request bodies
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));
          // Serve static frontend files from 'public' folder

const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // set this in .env, e.g. FRONTEND_URL=https://yourfrontend.vercel.app
  credentials : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));


app.use(cors());

// ✅ Step 3: Connect to MongoDB using Mongoose 
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Step 4: Define Mongoose Schema and Model
// A schema defines the structure of documents in MongoDB
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  plan: {
    type: String,
    enum: ['A', 'B', 'C', 'Custom'],        // Allowed plan values
    default: 'A'
  }
});
const User = mongoose.model('User', userSchema); // Create 'User' model from schema

// ✅ Step 5: Define API Routes

// ➤ GET /
// Basic route to confirm server is running
app.get('/', (req, res) => {
  res.send("MongoDB is working locally!");
});

// ➤ POST /add
// Add a new user to the database
app.post('/add', async (req, res) => {
  try {
    const user = new User(req.body);       // Create user document from request body
    await user.save();                     // Save to MongoDB
    res.status(201).send(user);            // Respond with saved user
  } catch (err) {
    res.status(400).send({ error: "Could not add user" });
  }
});

// ➤ GET /users
// Fetch users with search, sort, and pagination
app.get('/users', async (req, res) => {
  try {
    let { page = 1, limit = 3, sort = 'name', search = '', plan } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // Build filter based on search & plan
    let filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' }; // case-insensitive search
    if (plan) filter.plan = plan;

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(filter)
      .sort({ [sort]: 1 })                  // Sort by field
      .skip((page - 1) * limit)            // Pagination: skip records
      .limit(limit);                       // Limit results per page

    res.json({ users, totalPages });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Could not fetch users" });
  }
});

// ➤ PUT /update/:id
// Update a user by ID
app.put('/update/:id', async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.send(updated);
  } catch (err) {
    res.status(400).send({ error: "Could not update user" });
  }
});

// ➤ DELETE /delete/:id
// Delete a user by ID
app.delete('/delete/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.send({ message: "User deleted" });
  } catch (err) {
    res.status(500).send({ error: "Could not delete user" });
  }
});

// ✅ Step 6: Start the Express server
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
