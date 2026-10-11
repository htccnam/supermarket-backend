import { Router } from "express";
import { listMyInvoices, postInvoice } from "../controllers/invoice.controller";
import { requireAuth } from "../middlewares/auth";
const router = Router();
router.post("/", requireAuth, postInvoice);
router.get("/", requireAuth, listMyInvoices);
export default router;
