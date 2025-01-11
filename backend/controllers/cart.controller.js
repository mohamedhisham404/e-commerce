import Product from "../models/product.model.js";
import { httpStatus } from "../utils/httpStatus.js";

export const getCartProducts = async (req, res) => {
    try {
        const products = await Product.find({ _id: { $in: req.user.cartItems } });

        //calculate the quantity 
		const cartItems = products.map((product) => {
			const item = req.user.cartItems.find((cartItem) => cartItem.id === product.id);
			return { ...product.toJSON(), quantity: item.quantity };
		});

        res.status(200).json({
            status: httpStatus.SUCCESS,
            data: cartItems,
        });
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};

export const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
		const user = req.user;
		const existingItem = user.cartItems.find((item) => item.id === productId);
        if (existingItem) {
			existingItem.quantity += 1;
		} else {
			user.cartItems.push(productId);
		}

		await user.save();
		res.json(user.cartItems);
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};

export const removeAllFromCart = async (req, res) => {
    try {
        const user = req.user;
        const { productId } = req.body;

        if(!productId) {
            user.cartItems = [];
        }else{
            user.cartItems = user.cartItems.filter(item => item.id !== productId);
        }

        await user.save();
        res.status(200).json({
            status: httpStatus.SUCCESS,
            data: user.cartItems,
        });
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};

export const updateQuantity = async (req, res) => {
    try {
        const {id:productId} = req.params;
        const {quantity} = req.body;
        const user = req.user;
        const existingItem = user.cartItems.find((item)=>item.id === productId);
        
        if(existingItem){
            if(quantity === 0){
                user.cartItems = user.cartItems.filter(item => item.id !== productId);
                await user.save();
                return res.status(200).json({
                    status: httpStatus.SUCCESS,
                    data: user.cartItems,
                });
            }
            
            existingItem.quantity = quantity;
            await user.save();
            return res.status(200).json({
                status: httpStatus.SUCCESS,
                data: user.cartItems,
            });
        }else{
            return res.status(404).json({
                status: httpStatus.ERROR,
                data: "Product not found in cart",
            });
        }
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};
