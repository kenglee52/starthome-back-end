import { Router } from "express";
import { getProvinces, getDistrictByProvince, createProvince } from "../controllers/province.controller";

const router = Router();

router.get("/", getProvinces);
router.get("/districts/:provinceID", getDistrictByProvince);
router.post("/", createProvince);
export default router;