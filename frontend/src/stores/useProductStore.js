import {create} from 'zustand';
import axios from '../lib/axios';
import {toast} from 'react-hot-toast';

export const useProductStore = create((set) => ({
    products:[],
    loading: false,

    setProducts: (products) => set({products}),

    createProduct: async (newProduct) => {
        set({loading: true});
        try {
            const res = await axios.post('/products', newProduct);
            set((prevState) => ({
                products: [...prevState.products, res.data.data],
                loading: false,
            }));
            toast.success('Product created successfully');
        } catch (error) {
            set({loading: false});
            toast.error(error.response.data.data || 'An error occurred');
            console.log(error.response.data);
        }
    },

    deleteProduct: async (productId) => {
        set({loading: true});
        try {
            await axios.delete(`/products/${productId}`);
            set((prevState) => ({
                products: prevState.products.filter((product) => product._id !== productId),
                loading: false,
            }));
            toast.success('Product deleted successfully');
        } catch (error) {
            set({loading: false});
            toast.error(error.response.data.data || 'An error occurred');
            console.log(error.response.data);
        }
    },

    toggleFeaturedProduct: async (productId) => {
        set({loading: true});
        try {
            const res = await axios.patch(`/products/${productId}`);
            set((prevState) => ({
                products: prevState.products.map((product) =>
                    product._id === productId ? res.data.data : product
                ),
                loading: false,
            }));
            toast.success('Product updated successfully');
        } catch (error) {
            set({loading: false});
            toast.error(error.response.data.data || 'An error occurred');
            console.log(error.response.data);
        }
    },

    fetchAllProducts: async () => {
        set({loading: true});
        try {
            const res = await axios.get('/products');
            set({products: res.data.data, loading: false});
        } catch (error) {
            set({loading: false});
            toast.error(error.response.data.data || 'An error occurred');
            console.log(error.response.data);
        }
    },

    fetchProductsByCategory: async (category) => {
        set({loading: true});
        try {
            const res = await axios.get(`/products/category/${category}`);
            set({products: res.data.data, loading: false});
        } catch (error) {
            set({loading: false});
            toast.error(error.response.data.data || 'An error occurred');
            console.log(error.response.data);
        }
    }
}));
    


