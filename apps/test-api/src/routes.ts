import { Router } from "express";
import {routes as organizationRoutes} from "./features/organization/organizationRoutes";

export const router = Router();
router.use(organizationRoutes);

