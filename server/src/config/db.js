// connects backend to databases

import mongoose from 'mongoose';
import dns from 'node:dns';

// Force Node.js to use Google & Cloudflare DNS for SRV queries
dns.setServers(['8.8.8.8', '1.1.1.1']);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`mongodb connected: ${conn.connection.host}`); 
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    process.exit(1);
  }
};