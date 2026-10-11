import { Router } from "express";
import { listProducts } from "../controllers/product.controller";
import { requireAuth } from "../middlewares/auth";
const router = Router();
router.get("/", requireAuth, listProducts);
export default router;
