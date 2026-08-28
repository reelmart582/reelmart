const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name:     { type: String, required: true },
    price:    { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    image:    { type: String, default: "" },
    seller:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    paymentMethod: { type: String, default: "card" },
    deliveryMethod: { type: String, default: "standard" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    paystackRef: { type: String, default: "", index: true },
    stockReduced: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"], default: "pending" },
    orderNumber: { type: String, unique: true }
}, { timestamps: true });

orderSchema.pre("save", function() {
    if (!this.orderNumber) {
        const year = new Date().getFullYear();
        const rand = Math.floor(10000 + Math.random() * 90000);
        this.orderNumber = `RM-${year}-${rand}`;
    }
});

module.exports = mongoose.model("Order", orderSchema);
