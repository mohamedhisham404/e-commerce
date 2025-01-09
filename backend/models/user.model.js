import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            required: "Email address is required",
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                "Please fill a valid email address",
            ],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
        },
        cartItems: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                },
                quantity: {
                    type: Number,
                    default: 1,
                },
            },
        ],
        role: {
            type: String,
            enum: ["customer", "admin"],
            default: "customer",
        },
    },
    { timestamps: true }
);

// Hash the password before saving the user model
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare user password with the entered password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;

