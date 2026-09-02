const express = require("express");
const router  = express.Router();
const https   = require("https");
const Order   = require("../models/order");
const Product = require("../models/product");
const authMiddleware = require("../middleware/authmiddleware");

// ── Initialize Paystack payment ───────────────────────────────
router.post("/initialize", authMiddleware, async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findOne({ _id: orderId, user: req.user.id });
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        if (order.paymentStatus === "paid") return res.status(400).json({ success: false, message: "This order has already been paid for." });

        const user = req.user;
        const amount = Math.round(order.totalAmount * 100); // Paystack uses kobo

        const params = JSON.stringify({
            email:     user.email,
            amount:    amount,
            reference: `RM-${Date.now()}-${orderId}`,
            callback_url: `${process.env.APP_URL}/payment-success.html`,
            metadata: {
                orderId:    orderId,
                customerName: order.fullName
            }
        });

        const options = {
            hostname: "api.paystack.co",
            port:      443,
            path:      "/transaction/initialize",
            method:    "POST",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json"
            }
        };

        const paystackReq = https.request(options, paystackRes => {
            let data = "";
            paystackRes.on("data", chunk => data += chunk);
            paystackRes.on("end", async () => {
                const response = JSON.parse(data);
                if (response.status) {
                    // Save reference to order
                    order.paystackRef = response.data.reference;
                    await order.save();
                    res.json({ success: true, data: response.data });
                } else {
                    res.status(400).json({ success: false, message: response.message });
                }
            });
        });

        paystackReq.on("error", err => {
            res.status(500).json({ success: false, message: err.message });
        });

        paystackReq.write(params);
        paystackReq.end();

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── Verify Paystack payment ───────────────────────────────────
router.get("/verify/:reference", authMiddleware, async (req, res) => {
    try {
        const { reference } = req.params;

        const options = {
            hostname: "api.paystack.co",
            port:      443,
            path:      `/transaction/verify/${encodeURIComponent(reference)}`,
            method:    "GET",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        };

        const paystackReq = https.request(options, paystackRes => {
            let data = "";
            paystackRes.on("data", chunk => data += chunk);
            paystackRes.on("end", async () => {
                const response = JSON.parse(data);

                if (response.status && response.data.status === "success") {
                    // Find order by reference and mark as paid
                    const order = await Order.findOne({ paystackRef: reference });
                    if (order) {
                        if (!order.stockReduced) {
                            for (const item of order.items) {
                                const updated = await Product.findOneAndUpdate({ _id:item.product, stock:{ $gte:item.quantity } }, { $inc:{stock:-item.quantity} }, { returnDocument:"after" });
                                if (!updated) return res.status(409).json({success:false,message:`Payment succeeded but stock is unavailable for ${item.name}. Please contact support.`});
                            }
                            order.stockReduced = true;
                        }
                        order.status = "confirmed";
                        order.paymentStatus = "paid";
                        await order.save();
                    }
                    res.json({ success: true, message: "Payment verified", order });
                } else {
                    res.status(400).json({ success: false, message: "Payment verification failed" });
                }
            });
        });

        paystackReq.on("error", err => {
            res.status(500).json({ success: false, message: err.message });
        });

        paystackReq.end();

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ── Paystack Webhook ──────────────────────────────────────────
router.post("/webhook", async (req, res) => {
    const crypto = require("crypto");
    const hash   = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
        return res.status(401).send("Invalid signature");
    }

    const event = req.body;

    if (event.event === "charge.success") {
        const reference = event.data.reference;
        const order = await Order.findOne({ paystackRef: reference });
        if (order) {
            order.status        = "confirmed";
            order.paymentStatus = "paid";
            await order.save();
        }
    }

    res.sendStatus(200);
});

module.exports = router;