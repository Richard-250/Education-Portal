import express from "express";
import cors from "cors";
import passport from "passport";
import session from "express-session";
// import { connectDB } from "./config/db.js";
import { mongoManager } from "./config/db.js";
// import User from "./models/user.js";
import allRouters from "./routes/index.js"

const app = express();

app.use(cors());

(async () => {
  try {
    await mongoManager.connect();
    console.log('MongoDB connection successful!');
    // const user = await User.create({ firstName: 'gasore', lastName: 'mbonyi', email: 'example@gmail.com', password: 'hxhs1234', phoneNumber: '1234567890' });
    // await user.save();
    // console.log('User saved successfully');
  } catch (error) {
    console.error('Error:', error);
  }
})();


app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());


app.use(allRouters);

export default app;