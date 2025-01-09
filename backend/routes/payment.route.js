import express from "express";
import {
    createCheckoutSession,
} from "../controllers/payment.controller.js";
import { protectRoute } from "../middleware/auth.middlware.js";

const router = express.Router();

router.post("/create-checkout-session", protectRoute, createCheckoutSession);


export default router;