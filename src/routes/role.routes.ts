import { Router } from "express";
import { getRole, createRole } from "../controllers/role.controller";

const router = Router();
router.get('/', getRole);
router.post("/", createRole);
export default router;