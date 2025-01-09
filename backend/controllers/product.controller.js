import Product from "../models/product.model.js";
import { httpStatus } from "../utils/httpStatus.js";
import cloudinary from "../lib/cloudinary.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();

        if (!products) {
            return res.status(404).json({
                status: httpStatus.FAIL,
                data: "No products found",
            });
        }

        res.status(200).json({
            status: httpStatus.SUCCESS,
            data: products,
        });
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};

export const getFeaturedProducts = async (req, res) => {
    try {
        const products = await Product.find({ isFeatured: true });

        if (!products) {
            return res.status(404).json({
                status: httpStatus.FAIL,
                data: "No featured products found",
            });
        }

        res.status(200).json({
            status: httpStatus.SUCCESS,
            data: products,
        });
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category } = req.body;

        let cloudinaryResponse = null;
        if (image) {
            cloudinaryResponse = await cloudinary.uploader.upload(image, {
                folder: "products",
            });
        }

        const product = await Product.create({
            name,
            description,
            price,
            image: cloudinaryResponse?.secure_url
                ? cloudinaryResponse.secure_url
                : "",
            category,
        });

        res.status(201).json({
            status: httpStatus.SUCCESS,
            data: product,
        });
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                status: httpStatus.FAIL,
                data: "Product not found",
            });
        }

        if (product.image) {
            const publicId = product.image.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(`products/${publicId}`);
        }

        res.status(200).json({
            status: httpStatus.SUCCESS,
            data: "Product deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};

export const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            { $sample: { size: 3 } },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    price: 1,
                    image: 1,
                    description: 1,
                },
            },
        ]);

        if (!products) {
            return res.status(404).json({
                status: httpStatus.FAIL,
                data: "No recommended products found",
            });
        }

        res.status(200).json({
            status: httpStatus.SUCCESS,
            data: products,
        });
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};

export const getProductsByCategory = async (req, res) => {
    try {
        const category = req.params.category;

        const products = await Product.find({ category });

        if (!products) {
            return res.status(404).json({
                status: httpStatus.FAIL,
                data: "No products found",
            });
        }

        res.status(200).json({
            status: httpStatus.SUCCESS,
            data: products,
        });
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};

export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                status: httpStatus.FAIL,
                data: "Product not found",
            });
        }

        product.isFeatured = !product.isFeatured;
        await product.save();

        res.status(200).json({
            status: httpStatus.SUCCESS,
            data: product,
        });
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};
