import { protectRoute } from "../../../backend/middleware/auth.middlware.js";
import jwt from "jsonwebtoken";
import User from "../../../backend/models/user.model.js";
import { httpStatus } from "../../../backend/utils/httpStatus.js";

// Mock dependencies
jest.mock("jsonwebtoken");
jest.mock("../../../backend/models/user.model.js");

describe("protectRoute Middleware", () => {
    let req, res, next, jsonMock, statusMock;

    beforeEach(() => {
        req = {
            cookies: {},
        };

        jsonMock = jest.fn();
        statusMock = jest.fn(() => ({ json: jsonMock }));
        res = {
            status: statusMock,
        };

        next = jest.fn();

        jest.clearAllMocks();
    });

    it("should return 401 if no access token is provided", async () => {
        await protectRoute(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.FAIL,
            data: "You are not logged in",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if the token is invalid", async () => {
        req.cookies.accessToken = "invalidToken";
        jwt.verify.mockImplementation(() => {
            throw new jwt.JsonWebTokenError("jwt malformed");
        });

        await protectRoute(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith("invalidToken", process.env.ACCESS_TOKEN_SECRET);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.FAIL,    
            data: "You are not logged in",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if the token has expired", async () => {
        req.cookies.accessToken = "expiredToken";
        jwt.verify.mockImplementation(() => {
            throw new jwt.TokenExpiredError("jwt expired", new Date());
        });

        await protectRoute(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith("expiredToken", process.env.ACCESS_TOKEN_SECRET);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.FAIL,
            data: "Token expired",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 404 if the user is not found", async () => {
        req.cookies.accessToken = "validToken";
        jwt.verify.mockReturnValue({ userId: "mockUserId" });
        User.findById.mockResolvedValue(null);

        await protectRoute(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith("validToken", process.env.ACCESS_TOKEN_SECRET);
        expect(User.findById).toHaveBeenCalledWith("mockUserId");
        expect(res.status).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.FAIL,
            data: "User not found",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("should call next if the token is valid and the user is found", async () => {
        req.cookies.accessToken = "validToken";
        jwt.verify.mockReturnValue({ userId: "mockUserId" });
        const mockUser = { _id: "mockUserId", name: "Test User", email: "test@example.com" };
        User.findById.mockResolvedValue(mockUser);

        await protectRoute(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith("validToken", process.env.ACCESS_TOKEN_SECRET);
        expect(User.findById).toHaveBeenCalledWith("mockUserId");
        expect(req.user).toEqual(mockUser);
        expect(next).toHaveBeenCalled();
    });

    it("should return 500 if an unexpected error occurs", async () => {
        req.cookies.accessToken = "validToken";
        jwt.verify.mockImplementation(() => {
            throw new Error("Unexpected error");
        });

        await protectRoute(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith("validToken", process.env.ACCESS_TOKEN_SECRET);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
            status: httpStatus.ERROR,
            data: "Unexpected error",
        });
        expect(next).not.toHaveBeenCalled();
    });
});
