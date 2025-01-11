import {create} from 'zustand';
//global state management
import axios from '../lib/axios';
import {toast} from 'react-hot-toast';

export const useUserStore = create((set,get) => ({
    user: null,
    loading:false,
    checkingAuth: true,

    signup: async ({ name, email, password, confirmPassword }) => {
		set({ loading: true });

		if (password !== confirmPassword) {
			set({ loading: false });
			return toast.error("Passwords do not match");
		}

		try {
            const res = await axios.post("/auth/signup", { name, email, password });
			set({ user: res.data.data, loading: false });
            toast.success("Account created successfully");  
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.data || "An error occurred");
		}
	},

    login: async ({ email, password }) => {
		set({ loading: true });

		try {
            const res = await axios.post("/auth/login", { email, password });
			set({ user: res.data.data, loading: false });
            toast.success("Welcome back");   
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.data || "An error occurred");
		}
	},

    checkAuth: async () => {
        set({ checkingAuth: true });
        try {
            const res = await axios.get("/auth/profile");
            set({ user: res.data, checkingAuth: false });
        } catch (error) {
            console.log(error);
            set({ checkingAuth: false, user: null });
        }
    },

    logout : async () => {
        try {
            await axios.post("/auth/logout");
            set({ user: null});
            toast.success("Logged out successfully");
        } catch (error) {
            toast.error(error.response.data.data || "An error occurred during logout");
        }
    },

    refreshToken : async () => {
        if(get().checkingAuth) return;

        set({checkingAuth: true});
        try {
            const res = await axios.post("/auth/refresh-token");
            set({ checkingAuth: false});
            return res.data.data;
        } catch (error) {
            console.log(error);
            set({checkingAuth: false, user: null});
        }
    },
}));
    
let refreshPromise = null;

axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// If a refresh is already in progress, wait for it to complete
				if (refreshPromise) {
					await refreshPromise;
					return axios(originalRequest);
				}

				// Start a new refresh process
				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

				return axios(originalRequest);
			} catch (refreshError) {
				// If refresh fails, redirect to login or handle as needed
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);