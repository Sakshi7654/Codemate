import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (userId, role) => { // role also inside token payload, so that future socket events doent have to query the db to find the role
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );
};

export const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' }); //to frontend!!
    }

    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] // $or is a mongodb query operator, that works like a || or statement...either with mail or username
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || 'student', 
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[Auth Error - Register]:', error);
    res.status(500).json({ error: error.message || 'Server registration failed' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[Auth Error - Login]:', error);
    res.status(500).json({ error: 'Server login failed' });
  }
};