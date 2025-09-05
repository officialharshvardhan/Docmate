// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');
const bcrypt = require('bcrypt');

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('./models/chatModel');
const User = require('./models/userModel');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve your current project root (so index.html, images/, etc. work)
app.use(express.static(path.join(__dirname, 'public')));


// === MongoDB connection ===
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB Error:', err));

// === Google Gemini Setup ===
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// You can switch to "gemini-1.5-pro" if you want higher quality
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
// === Chatbot Route ===
app.post('/chatbot', async (req, res) => {
  const { username, message } = req.body;
  if (!username || !message) return res.status(400).json({ reply: 'Missing data' });

  try {
    let chat = await Chat.findOne({ username });
    if (!chat) chat = new Chat({ username, messages: [] });

    chat.messages.push({ role: 'user', content: message });

    const historyText = chat.messages.map((m) => `${m.role}: ${m.content}`).join('\n');

    const result = await model.generateContent(historyText);
    const botReply = result.response.text();

    chat.messages.push({ role: 'assistant', content: botReply });
    await chat.save();

    res.json({ reply: botReply });
  } catch (err) {
    console.error('❌ Gemini API Error:', err.message);
    res.status(500).json({ reply: 'Sorry, my brain glitched. Try again in a moment.' });
  }
});

// === Clear Chat Route ===
app.post('/clear-chat', async (req, res) => {
  const { username } = req.body;
  try {
    await Chat.deleteOne({ username });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === Auth Routes (MongoDB + bcrypt) ===
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.json({ success: false, message: 'Username and password are required' });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.json({ success: false, message: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ username, passwordHash });

    res.json({ success: true, message: 'User registered successfully' });
  } catch (e) {
    console.error('Signup error:', e);
    res.json({ success: false, message: 'Failed to register user' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.json({ success: false, message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) return res.json({ success: false, message: 'Invalid username or password' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.json({ success: false, message: 'Invalid username or password' });

    res.json({ success: true, message: 'Login successful' });
  } catch (e) {
    console.error('Login error:', e);
    res.json({ success: false, message: 'Login failed' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
