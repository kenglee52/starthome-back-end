import { getAllCurrency } from "../controllers/currency.controller";
import { Router } from "express";

const router  = Router();
router.get("/", getAllCurrency);

export default router;