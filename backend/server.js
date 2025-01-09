import express from "express";
import dotenv from "dotenv";
import connectDB from "./lib/db.js";
import helmet from "helmet";
import cookieParser from "cookie-parser";

//Routes
import authRoutes from "./routes/auth.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

//Middlewares
app.use(express.json());
app.use(cookieParser());

app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                "script-src": ["'self'", "cdn.jsdelivr.net"],
            },
        },
    })
);

app.use("/api/v1/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
    connectDB();
});
