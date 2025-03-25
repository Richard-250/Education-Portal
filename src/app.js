import express from "express";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import cookieParser from "cookie-parser";
import { mongoManager } from "./config/db.js";

import allRouters from "./routes/index.js"
import { createError } from "./utils/errorhandler.js";
const app = express();

app.use(cors());

(async () => {
  try {
    await mongoManager.connect();
    console.log('MongoDB connection successful!');
  } catch (error) {
    console.error('Error:', error);
  }
})();

app.use(cookieParser(process.env.COOKIES_SECRET))
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
app.use(createError);
// In your error handling middleware
// app.use(async (err, req, res, next) => {
//   await logError(err); // Log all errors
  
//   res.status(err.statusCode || 500).json({
//     success: false,
//     message: err.message,
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//   });
// });
export default app;