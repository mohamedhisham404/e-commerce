import express from "express";
import {
    getAllProducts,
    getFeaturedProducts,
    deleteProduct,
    createProduct,
    getRecommendedProducts,
    getProductsByCategory,
    toggleFeaturedProduct
} from "../controllers/product.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middlware.js";
const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/recommendations", getRecommendedProducts);
router.post("/", protectRoute, adminRoute, createProduct);
router.patch("/:id", protectRoute, adminRoute, toggleFeaturedProduct);
router.post("/:id", protectRoute, adminRoute, deleteProduct);

export default router;
