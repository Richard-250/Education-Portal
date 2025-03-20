import express from "express";
// import { connectDB } from "./config/db.js";
import { mongoManager } from "./config/db.js";
import User from "./models/user.js";

const app = express();

(async () => {
  try {
    await mongoManager.connect();
    console.log('MongoDB connection successful!');

    // Create and save a user
    const user = await User.create({ firstName: 'gasore', lastName: 'mbonyi', email: 'example@gmail.com', password: 'hxhs1234' });
    await user.save();
    console.log('User saved successfully');

    // const stats = await mongoManager.getStats();
    // console.log(stats);
  } catch (error) {
    console.error('Error:', error);
  }
})();

export default app;