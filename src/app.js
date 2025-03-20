import express from "express";
// import { connectDB } from "./config/db.js";
import { mongoManager } from "./config/db.js";
import mongoose from "mongoose";

const app = express();

(async () => {
  try {
    await mongoManager.connect();
    console.log('MongoDB connection successful!');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
  }
})();


// const stats = await mongoManager.getStats();
// console.log(stats);

export default app; 