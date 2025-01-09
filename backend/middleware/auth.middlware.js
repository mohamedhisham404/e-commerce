import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { httpStatus } from "../utils/httpStatus.js";

export const protectRoute = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            return res.status(401).json({
                status: httpStatus.FAIL,
                data: "You are not logged in",
            });
        }

        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded.userId).select(
                "-password"
            );

            if (!user) {
                return res.status(404).json({
                    status: httpStatus.FAIL,
                    data: "User not found",
                });
            }

            req.user = user;

            next();
        } catch (error) {
            if(error.name === "TokenExpiredError") {
                return res.status(401).json({
                    status: httpStatus.FAIL,
                    data: "Token expired",
                });
            }
            throw error;
        }
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};

export const adminRoute = async (req, res, next) => {
    try {
        if(req.user && req.user.role === 'admin'){next();}
        else{
            return res.status(403).json({
                status: httpStatus.FAIL,
                data: "You are not authorized to access this route",
            });
        }

        
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};

