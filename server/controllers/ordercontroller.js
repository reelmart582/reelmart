const Order = require("../models/order");
const Product = require("../models/product");

const ALLOWED_STATUS = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_ORDER = { pending: 0, confirmed: 1, shipped: 2, delivered: 3 };

const sellerOrAdmin = req => req.user && ["seller", "admin"].includes(req.user.role);

const placeOrder = async (req, res) => {
    try {
        const { items, totalAmount, fullName, phone, address, city, state, paymentMethod, deliveryMethod } = req.body;
        if (!items || !items.length) return res.status(400).json({ success:false, message:"No items in order" });

        const orderItems = [];
        let subtotal = 0;
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) return res.status(404).json({ success:false, message:`Product not found: ${item.name || item.product}` });
            const quantity = Math.max(1, Number(item.quantity || 1));
            if (product.stock < quantity) return res.status(400).json({ success:false, message:`Not enough stock for ${product.name}. Available: ${product.stock}` });
            const price = Number(product.price);
            subtotal += price * quantity;
            orderItems.push({ product:product._id, name:product.name, price, quantity, image:product.image || "", seller:product.seller || null });
        }

        const deliveryFee = deliveryMethod === "express" ? 2500 : 0;
        const vat = Math.round(subtotal * 0.075);
        const serverTotal = subtotal + deliveryFee + vat;
        if (!Number.isFinite(Number(totalAmount)) || Math.abs(Number(totalAmount) - serverTotal) > 1) return res.status(400).json({ success:false, message:"Order total is invalid. Please refresh your cart and try again." });

        const isPaystack = String(paymentMethod || "").toLowerCase() === "paystack";
        const order = await Order.create({
            user:req.user.id, items:orderItems, totalAmount:serverTotal, fullName, phone, address, city, state,
            paymentMethod:paymentMethod || "card", deliveryMethod:deliveryMethod || "standard", paymentStatus:"pending", status:"pending", stockReduced:false
        });

        if (!isPaystack) {
            for (const item of orderItems) {
                const updated = await Product.findOneAndUpdate({ _id:item.product, stock:{ $gte:item.quantity } }, { $inc:{ stock:-item.quantity } }, { returnDocument:"after" });
                if (!updated) return res.status(409).json({ success:false, message:`Stock changed while placing ${item.name}. Please try again.` });
            }
            order.stockReduced = true;
            await order.save();
        }
        res.status(201).json({ success:true, message:"Order created successfully", order });
    } catch (error) {
        console.error("Place order error:", error);
        res.status(500).json({ success:false, message:error.message });
    }
};

const getMyOrders = async (req,res) => {
    try {
        const orders = await Order.find({ user:req.user.id }).populate("items.product","name image seller").sort({createdAt:-1});
        res.json({success:true,orders});
    } catch(error){ res.status(500).json({success:false,message:error.message}); }
};

const getOrder = async (req,res) => {
    try {
        const order = await Order.findOne({_id:req.params.id,user:req.user.id}).populate("items.product","name image seller");
        if(!order) return res.status(404).json({success:false,message:"Order not found"});
        res.json({success:true,order});
    } catch(error){ res.status(500).json({success:false,message:error.message}); }
};

const getSellerOrders = async (req,res) => {
    try {
        if(!sellerOrAdmin(req)) return res.status(403).json({success:false,message:"Seller access required"});
        const products = await Product.find({seller:req.user.id}).select("_id");
        const ids = products.map(p=>p._id);
        const orders = await Order.find({"items.product":{$in:ids}}).populate("user","fullName email").populate("items.product","name image seller price stock").sort({createdAt:-1});
        const result = orders.map(order=>{
            const items=order.items.filter(item=>{const sid=item.product?.seller||item.seller; return sid && String(sid)===String(req.user.id)});
            return {...order.toObject(),sellerItems:items,sellerSubtotal:items.reduce((sum,i)=>sum+Number(i.price||0)*Number(i.quantity||0),0)};
        }).filter(o=>o.sellerItems.length);
        res.json({success:true,orders:result});
    } catch(error){console.error("Seller orders error:",error);res.status(500).json({success:false,message:error.message});}
};

const updateOrderStatus = async (req,res) => {
    try {
        if(!sellerOrAdmin(req)) return res.status(403).json({success:false,message:"Seller access required"});
        const {status}=req.body;
        if(!ALLOWED_STATUS.includes(status)) return res.status(400).json({success:false,message:"Invalid order status"});
        const order=await Order.findById(req.params.id).populate("items.product","seller");
        if(!order) return res.status(404).json({success:false,message:"Order not found"});
        const owns=order.items.some(i=>{const sid=i.product?.seller||i.seller;return sid&&String(sid)===String(req.user.id)});
        if(!owns&&req.user.role!=="admin") return res.status(403).json({success:false,message:"You can only manage orders containing your products"});
        if(status!=="cancelled"&&status!=="pending"&&order.status!=="cancelled"){const current=STATUS_ORDER[order.status],next=STATUS_ORDER[status];if(current!==undefined&&next!==undefined&&next<current)return res.status(400).json({success:false,message:"Order status cannot move backwards"});}
        order.status=status;await order.save();res.json({success:true,message:`Order marked ${status}`,order});
    }catch(error){console.error("Update order status error:",error);res.status(500).json({success:false,message:error.message});}
};

module.exports={placeOrder,getMyOrders,getOrder,getSellerOrders,updateOrderStatus};
