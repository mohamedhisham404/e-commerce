import { httpStatus } from "../utils/httpStatus.js";
import Order from "../models/order.model.js";
import Coupon from "../models/coupon.model.js";
import {stripe} from "../lib/stripe.js";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

export const createCheckoutSession = async (req, res) => {
    try {
        const { products, couponCode } = req.body;

        if (!Array.isArray(products) || products.length < 1) {
            return res.status(400).json({
                status: httpStatus.ERROR,
                data: "Invalid or empty products array",
            });
        }

        let totalAmount = 0;
        const lineItems = products.map((product) => {
            const amount = Math.round(product.price * 100); // Convert to cents
            totalAmount += amount * product.quantity;

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                        images: [product.image],
                    },
                    unit_amount: amount,
                },
                quantity: product.quantity || 1,
            };
        });

        let coupon = null;
        if (couponCode) {
            coupon = await Coupon.findOne({
                code: couponCode,
                userId: req.user._id,
                isActive: true,
            });
            if (coupon) {
                totalAmount -= Math.round(
                    (totalAmount * coupon.discountPercentage) / 100
                );
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
            discounts: coupon
                ? [
                      {
                          coupon: await createStripeCoupon(
                              coupon.discountPercentage
                          ),
                      },
                  ]
                : [],
            metadata: {
                userId: req.user._id.toString(),
                couponCode: couponCode || "",
                products: JSON.stringify(
                    products.map((p) => ({
                        id: p._id,
                        quantity: p.quantity,
                        price: p.price,
                    }))
                ),
            },
        });

        if(totalAmount >20000) {//200$
            await createNewCoupon(req.user._id);
        }

        res.status(200).json({
            status: httpStatus.SUCCESS,
            data: {
                id: session.id,
                totalAmount: totalAmount/100
            },
        });
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};


async function createStripeCoupon(discountPercentage) {
	const coupon = await stripe.coupons.create({
		percent_off: discountPercentage,
		duration: "once",
	});

	return coupon.id;
}

async function createNewCoupon(userId) {
	await Coupon.findOneAndDelete({ userId });

	const newCoupon = new Coupon({
		code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
		discountPercentage: 10,
		expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
		userId: userId,
	});

	await newCoupon.save();

	return newCoupon;
}