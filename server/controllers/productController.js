const Product = require("../models/order");

// Create Product
const createProduct = async (req,res)=>{

    try{

        const {
            name,
            description,
            price,
            category,
            stock,
            seller,
            attributes,
            variants
        } = req.body;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: "Please sign in to create products." });
        }

        let parsedAttributes = {};
        let parsedVariants = [];

        try {
            parsedAttributes = attributes ? JSON.parse(attributes) : {};
        } catch {
            parsedAttributes = {};
        }

        try {
            parsedVariants = variants ? JSON.parse(variants) : [];
        } catch {
            parsedVariants = [];
        }

        const product = await Product.create({

            name,
            description,
            price,
            category,
            stock,
            seller: req.user.id,
            attributes: parsedAttributes,
            variants: parsedVariants,

            image: req.files && req.files["image"] ? req.files["image"][0].filename : "",
            reelVideo: req.files && req.files["reelVideo"] ? req.files["reelVideo"][0].filename : ""

        });

        res.status(201).json({

            success:true,
            message:"Product created successfully",

            product

        });

    }

    catch(error){

        console.log(error);

        res.status(500).json({

            success:false,
            message:error.message

        });

    }

};

// Get All Products

const getProducts = async(req,res)=>{

    try{

        const products = await Product.find().populate("seller","fullName email");

        res.json(products);

    }

    catch(error){

        res.status(500).json({

            message:error.message

        });

    }

};

// Get Single Product

const getProduct = async(req,res)=>{

    try{

        const product = await Product.findById(req.params.id).populate("seller","fullName username email");

        if(!product){

            return res.status(404).json({

                message:"Product not found"

            });

        }

        res.json(product);

    }

    catch(error){

        res.status(500).json({

            message:error.message

        });

    }

};

// Delete Product

const deleteProduct = async(req,res)=>{

    try{

        await Product.findByIdAndDelete(req.params.id);

        res.json({

            success:true,

            message:"Product deleted"

        });

    }

    catch(error){

        res.status(500).json({

            message:error.message

        });

    }

};

module.exports={

createProduct,
getProducts,
getProduct,
deleteProduct

};