import User from "../../../backend/models/user.model.js";
import generateTokens from "../../../backend/utils/generateTokens.js";
import setCookies from "../../../backend/utils/setCookies.js";
import {httpStatus} from "../../../backend/utils/httpStatus.js";
import jwt from "jsonwebtoken";
import { signup,login,logout,refreshToken } from "../../../backend/controllers/auth.controller.js";

// Mock external dependencies
jest.mock("../../../backend/models/user.model");
jest.mock("../../../backend/utils/generateTokens.js");
jest.mock("../../../backend/utils/setCookies.js");
jest.mock("jsonwebtoken");

describe("Signup Function", () => {
    let req, res, jsonMock, statusMock;

    beforeEach(() => {
        // Reset mocks and set up request and response objects
        req = {
            body: {
                email: "test@example.com",
                password: "password123",
                name: "Test User",
            },
        };

        jsonMock = jest.fn();
        statusMock = jest.fn(() => ({ json: jsonMock }));

        res = {
            status: statusMock,
            cookie: jest.fn(),
        };

        jest.clearAllMocks();
    });

    it("should return 400 if the user already exists", async () => {
        // Mock User.findOne to simulate an existing user
        User.findOne.mockResolvedValue({ email: "test@example.com" });

        await signup(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.FAIL,
            data: "User already exists",
        });
    });

    it("should create a new user, generate tokens, set cookies, and return user data", async () => {
        // Mock User.findOne to simulate no existing user
        User.findOne.mockResolvedValue(null);

        // Mock User.create to return a new user
        const mockUser = {
            _id: "mockUserId",
            name: "Test User",
            email: "test@example.com",
            role: "customer",
        };
        User.create.mockResolvedValue(mockUser);

        // Mock generateTokens
        generateTokens.mockReturnValue({
            accessToken: "mockAccessToken",
            refreshToken: "mockRefreshToken",
        });

        await signup(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(User.create).toHaveBeenCalledWith({
            name: "Test User",
            email: "test@example.com",
            password: "password123",
        });
        expect(generateTokens).toHaveBeenCalledWith("mockUserId");
        expect(setCookies).toHaveBeenCalledWith(res, "mockAccessToken", "mockRefreshToken");
        expect(res.status).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.SUCCESS,
            data: {
                user: {
                    _id: "mockUserId",
                    name: "Test User",
                    email: "test@example.com",
                    role: "customer",
                },
            },
        });
    });

    it("should return 500 if an error occurs", async () => {
        // Mock User.findOne to throw an error
        User.findOne.mockRejectedValue(new Error("Database error"));

        await signup(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.ERROR,
            data: "Database error",
        });
    });
});

describe("Login Function", () => {
    let req, res, jsonMock, statusMock;

    beforeEach(() => {
        // Reset mocks and set up request and response objects
        req = {
            body: {
                email: "test@example.com",
                password: "password123",
            },
        };
        jsonMock = jest.fn();
        statusMock = jest.fn(() => ({ json: jsonMock }));

        res = {
            status: statusMock,
            cookie: jest.fn(),
        };

        jest.clearAllMocks();
    });

    it("should return 401 if the user does not exist", async () => {
        // Mock User.findOne to simulate no existing user
        User.findOne.mockResolvedValue(null);

        await login(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.FAIL,
            data: "Invalid email or password",
        });
    });

    it("should return 401 if the password is incorrect", async () => {
        // Mock User.findOne to simulate an existing user
        const mockUser = {
            _id: "mockUserId",
            name: "Test User",
            email: "test@example.com",
            role: "customer",
            comparePassword: jest.fn().mockResolvedValue(false), // Simulate incorrect password
        };
        User.findOne.mockResolvedValue(mockUser);

        await login(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(mockUser.comparePassword).toHaveBeenCalledWith("password123");
        expect(res.status).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.FAIL,
            data: "Invalid email or password",
        });
    });

    it("should return user data and set cookies if login is successful", async () => {
        // Mock User.findOne to simulate an existing user
        const mockUser = {
            _id: "mockUserId",
            name: "Test User",
            email: "test@example.com",
            role: "customer",
            comparePassword: jest.fn().mockResolvedValue(true), // Simulate correct password
        };
        User.findOne.mockResolvedValue(mockUser);

        // Mock generateTokens to return mock tokens
        generateTokens.mockReturnValue({
            accessToken: "mockAccessToken",
            refreshToken: "mockRefreshToken",
        });

        // Mock setCookies
        setCookies.mockImplementation(() => {});

        await login(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(mockUser.comparePassword).toHaveBeenCalledWith("password123");
        expect(generateTokens).toHaveBeenCalledWith("mockUserId");
        expect(setCookies).toHaveBeenCalledWith(res, "mockAccessToken", "mockRefreshToken");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.SUCCESS,
            data: {
                user: {
                    _id: "mockUserId",
                    name: "Test User",
                    email: "test@example.com",
                    role: "customer",
                },
            },
        });
    });

    it("should return 500 if an error occurs", async () => {
        // Mock User.findOne to throw an error
        User.findOne.mockRejectedValue(new Error("Database error"));

        await login(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.ERROR,
            data: "Database error",
        });
    });
});

describe("Logout Function", () => {
    let req, res, jsonMock, statusMock;

    beforeEach(() => {
        // Reset mocks and set up request and response objects
        req = {};  // No specific body or params needed for logout
        jsonMock = jest.fn();
        statusMock = jest.fn(() => ({ json: jsonMock }));

        res = {
            clearCookie: jest.fn(),
            status: statusMock,
        };

        jest.clearAllMocks();
    });

    it("should clear cookies and return success message", async () => {
        await logout(req, res);

        // Verify that clearCookie was called for both tokens
        expect(res.clearCookie).toHaveBeenCalledWith("accessToken");
        expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");

        // Verify the response status and message
        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.SUCCESS,
            data: "Logged out successfully",
        });
    });

    it("should return 500 if an error occurs", async () => {
        // Mocking an error in the function
        res.clearCookie.mockImplementation(() => {
            throw new Error("Cookie error");
        });

        await logout(req, res);

        // Verify that the response status and message reflect the error
        expect(res.status).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.ERROR,
            data: "Cookie error",
        });
    });
});

describe("Refresh Token Function", () => {
    let req, res, jsonMock, statusMock;

    beforeEach(() => {
        req = {
            cookies: {
                refreshToken: "mockRefreshToken",
            },
        };
        jsonMock = jest.fn();
        statusMock = jest.fn(() => ({ json: jsonMock }));

        res = {
            cookie: jest.fn(),
            status: statusMock,
        };

        jest.clearAllMocks();
    });

    it("should return 401 if no refresh token is provided", async () => {
        req.cookies = {}; // Simulate missing refreshToken

        await refreshToken(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.FAIL,
            data: "Unauthorized",
        });
    });

    it("should return 500 if the refresh token is invalid", async () => {
        // Mock jwt.verify to throw an error, simulating an invalid token
        jwt.verify.mockImplementation(() => {
            throw new Error("Invalid token");
        });

        await refreshToken(req, res);

        expect(jwt.verify).toHaveBeenCalledWith(
            "mockRefreshToken",
            process.env.REFRESH_TOKEN_SECRET
        );
        expect(res.status).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.ERROR,
            data: "Invalid token",
        });
    });

    it("should set a new access token and return success if refresh token is valid", async () => {
        // Mock jwt.verify to return a decoded payload
        jwt.verify.mockReturnValue({ userId: "mockUserId" });

        // Mock jwt.sign to return a new access token
        jwt.sign.mockReturnValue("mockAccessToken");

        await refreshToken(req, res);

        expect(jwt.verify).toHaveBeenCalledWith(
            "mockRefreshToken",
            process.env.REFRESH_TOKEN_SECRET
        );
        expect(jwt.sign).toHaveBeenCalledWith(
            { userId: "mockUserId" },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );
        expect(res.cookie).toHaveBeenCalledWith("accessToken", "mockAccessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.SUCCESS,
            data: "Token refreshed successfully",
        });
    });

    it("should return 500 if an error occurs", async () => {
        // Mock jwt.verify to throw an error
        jwt.verify.mockImplementation(() => {
            throw new Error("Some error");
        });

        await refreshToken(req, res);

        expect(jwt.verify).toHaveBeenCalledWith(
            "mockRefreshToken",
            process.env.REFRESH_TOKEN_SECRET
        );
        expect(res.status).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.ERROR,
            data: "Some error",
        });
    });
});