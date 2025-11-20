import { Router } from "express";
import { getPositions, createPosition } from "../controllers/position.controller";

const router = Router();
router.get('/', getPositions);

router.post("/", createPosition)
export default router;