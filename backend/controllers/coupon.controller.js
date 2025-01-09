import { httpStatus } from "../utils/httpStatus.js";
import Coupon from "../models/coupon.model.js";

export const getCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findOne({userId: req.user._id, isActive: true});
        if (!coupon) {
            return res.status(404).json({
                status: httpStatus.ERROR,
                data: "No coupon found",
            });
        }
        res.status(200).json({
            status: httpStatus.SUCCESS,
            data: coupon,
        });
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};

export const validateCoupon = async (req, res) => {
    try {
        const { code } = req.body;

        const coupon = await Coupon.findOne({
            code: code,
            isActive: true,
            userId: req.user._id,
        });

        if (!coupon) {
            return res.status(404).json({
                status: httpStatus.ERROR,
                data: "Coupon not found",
            });
        };

        if(coupon.expiryDate < Date.now()) {
            coupon.isActive = false;
            await coupon.save();
            return res.status(400).json({
                status: httpStatus.ERROR,
                data: "Coupon has expired",
            });
        };

        res.status(200).json({
            status: httpStatus.SUCCESS,
            data: {
                code: coupon.code,
                discount: coupon.discountPercentage,
            },
        });
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
        
    }
};
