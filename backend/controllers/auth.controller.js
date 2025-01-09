import User from "../models/user.model.js";
import { httpStatus } from "../utils/httpStatus.js";
import generateTokens from "../utils/generateTokens.js";
import setCookies from "../utils/setCookies.js";
import jwt from "jsonwebtoken";

import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

export const signup = async (req, res) => {
    const { email, password, name } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({
                status: httpStatus.FAIL,
                data: "User already exists",
            });
        }

        const user = await User.create({
            name,
            email,
            password,
        });

        // authinticate user
        const { accessToken, refreshToken } = generateTokens(user._id);
        setCookies(res, accessToken, refreshToken);

        res.status(201).json({
            status: httpStatus.SUCCESS,
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                status: httpStatus.FAIL,
                data: "Invalid email or password",
            });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                status: httpStatus.FAIL,
                data: "Invalid email or password",
            });
        }

        if (user && isMatch) {
            const { accessToken, refreshToken } = generateTokens(user._id);
            setCookies(res, accessToken, refreshToken);

            res.status(200).json({
                status: httpStatus.SUCCESS,
                data: {
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    },
                },
            });
        }
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({
            status: httpStatus.SUCCESS,
            data: "Logged out successfully",
        });
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                status: httpStatus.FAIL,
                data: "Unauthorized",
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const accessToken = jwt.sign(
            { userId: decoded.userId },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict", // prevents CSRF attack, cross-site request forgery attack
            maxAge: 15 * 60 * 1000,
        });

        res.status(200).json({
            status: httpStatus.SUCCESS,
            data: "Token refreshed successfully",
        });
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        res.status(500).json({
            status: httpStatus.ERROR,
            data: error.message,
        });
    }
};
