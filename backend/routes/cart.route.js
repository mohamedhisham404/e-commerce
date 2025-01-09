import express from "express";
import {
    addToCart,
    removeAllFromCart,
    updateQuantity,
    getCartProducts,
} from "../controllers/cart.controller.js";
import {
    protectRoute,
    adminRoute,
} from "../middleware/auth.middlware.js";

const router = express.Router();

router.get("/", protectRoute, getCartProducts);
router.post("/", protectRoute, addToCart);
router.delete("/", protectRoute, removeAllFromCart);
router.put("/:id", protectRoute, updateQuantity);

export default router;
