import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'], //this warning-> in err in our express code...console.log(error.erros.username.message).........to prevent generic error-> path "username" is required..
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      enum: ['mentor', 'student'],
      default: 'student',
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Mongoose Pre-Save Hook: Automatically hash the password before saving to DB
userSchema.pre('save', async function () {
  // If the password hasn't been changed (e.g., updating email), don't re-hash it!
  if (!this.isModified('password')) {
    return;
  }

  // Generate a cryptographic salt and hash the plaintext password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // next();
});

// Helper Method: Compare entered password with hashed password in DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);