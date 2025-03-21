import { Router } from "express";
import userRoutes from "./api/userRoutes.js"
import welcome from "./welcomeRoute.js";

const routes = Router();

routes.use(userRoutes);
routes.use(welcome);

export default routes