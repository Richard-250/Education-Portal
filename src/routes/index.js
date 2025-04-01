import { Router } from "express";
import userRoutes from "./api/userRoutes.js"
import welcome from "./welcomeRoute.js";
import contentRoutes from './api/contentRoutes.js';
import comments from './api/commentsRoutes.js';

const routes = Router();

routes.use(userRoutes);
routes.use(welcome);
routes.use(contentRoutes);
routes.use(comments);
export default routes