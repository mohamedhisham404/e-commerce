import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCartStore = create((set, get) => ({
    cart: [],
    coupon: null,
    total: 0,
    subTotal: 0,
    isCouponApplied: false,

    getCartItems: async () => {
        try {
            const res = await axios.get("/cart");
            set({ cart: res.data.data });
            get().calculateTotals();
        } catch (error) {
            set({ cart: [] });
            toast.error(error.response.data.data || "An error occurred");
        }
    },

    addToCart: async (product) => {
        try {
			await axios.post("/cart", { productId: product._id });
			toast.success("Product added to cart");

			set((prevState) => {
				const existingItem = prevState.cart.find((item) => item._id === product._id);
                
				const newCart = existingItem
					? prevState.cart.map((item) =>
							item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
					  )
					: [...prevState.cart, { ...product, quantity: 1 }];
				return { cart: newCart };
			});
			get().calculateTotals();
		} catch (error) {
			toast.error(error.response.data.data || "An error occurred");
		}
    },

    calculateTotals: () => {
        const { cart, coupon } = get();
        const subTotal = cart.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
        );
        let total = subTotal;

        if (coupon) {
            const discount = (coupon.discountPercentage / 100) * subTotal;
            total = subTotal - discount;
        }

        set({ subTotal, total });
    },

    removeFromCart: async (productId) => {
        try {
            await axios.delete(`/cart`, {data:{productId}});
            set((prevState) => ({
                cart: prevState.cart.filter((item) => item._id !== productId),
            }));
            get().calculateTotals();
            toast.success("Product removed from cart");
        } catch (error) {
            toast.error(error.response.data.data || "An error occurred");
        }
    },

    updateQuantity: async (productId, quantity) => {
        if(quantity === 0 ){
            get().removeFromCart(productId);
            toast.success("Product removed from cart");
            return;
        }
        try {
            await axios.put(`/cart/${productId}`, {quantity});
            set((prevState) => ({
                cart: prevState.cart.map((item) =>
                    item._id === productId ? { ...item, quantity } : item
                ),
            }));
            get().calculateTotals();
        } catch (error) {
            toast.error(error.response.data.data || "An error occurred");
        }
    },

    clearCart: async () => {
       set({ cart: [] ,coupon: null,total: 0,subTotal: 0});
    },

    getMyCoupon: async () => {
        try {
            const res = await axios.get("/coupons");
            set({ coupon: res.data.data });
        } catch (error) {
            console.log(error.response.data.data);
        }
    },

    applyCoupon: async (couponCode) => {
        try {
            const res = await axios.post("/coupons/validate", { couponCode });
            set({ coupon: res.data.data, isCouponApplied: true });
            get().calculateTotals();
            toast.success("Coupon applied successfully");
        } catch (error) {
            toast.error(error.response?.data?.data || "An error occurred");
        }
    },

    removeCoupon: async () => {
        set({ coupon: null, isCouponApplied: false });
        get().calculateTotals();
        toast.success("Coupon removed successfully");
    },
}));
