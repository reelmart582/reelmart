const Product = require("../models/product");

// ======================================================
// CREATE PRODUCT
// ======================================================

const createProduct = async (req, res) => {

    try {

        // Debug uploaded files
        console.log("========== FILE UPLOAD DEBUG ==========");
        console.log("REQ FILES:", req.files);
        console.log("=======================================");

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


        // Check authentication
        if (!req.user || !req.user.id) {

            return res.status(401).json({
                success: false,
                message: "Please sign in to create products."
            });

        }


        // ======================================================
        // PARSE ATTRIBUTES
        // ======================================================

        let parsedAttributes = {};

        try {

            parsedAttributes = attributes
                ? JSON.parse(attributes)
                : {};

        } catch {

            parsedAttributes = {};

        }


        // ======================================================
        // PARSE VARIANTS
        // ======================================================

        let parsedVariants = [];

        try {

            parsedVariants = variants
                ? JSON.parse(variants)
                : [];

        } catch {

            parsedVariants = [];

        }


        // ======================================================
        // GET CLOUDINARY FILE URLS
        // ======================================================

        const imageUrl =
            req.files &&
            req.files["image"] &&
            req.files["image"][0]
                ? req.files["image"][0].path
                : "";


        const reelVideoUrl =
            req.files &&
            req.files["reelVideo"] &&
            req.files["reelVideo"][0]
                ? req.files["reelVideo"][0].path
                : "";


        // More useful upload debugging
        console.log("IMAGE URL:", imageUrl);
        console.log("REEL VIDEO URL:", reelVideoUrl);


        // ======================================================
        // CREATE PRODUCT
        // ======================================================

        const product = await Product.create({

            name,
            description,
            price,
            category,
            stock,

            // Always use the authenticated user's ID
            seller: req.user.id,

            attributes: parsedAttributes,

            variants: parsedVariants,

            // Cloudinary image URL
            image: imageUrl,

            // Cloudinary video URL
            reelVideo: reelVideoUrl

        });


        // ======================================================
        // SUCCESS RESPONSE
        // ======================================================

        res.status(201).json({

            success: true,

            message: "Product created successfully",

            product

        });

    }

    catch (error) {

        console.log("CREATE PRODUCT ERROR:", error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// ======================================================
// GET ALL PRODUCTS
// ======================================================

const getProducts = async (req, res) => {

    try {

        const products = await Product
            .find()
            .populate("seller", "fullName email");

        res.json(products);

    }

    catch (error) {

        res.status(500).json({

            message: error.message

        });

    }

};


// ======================================================
// GET SINGLE PRODUCT
// ======================================================

const getProduct = async (req, res) => {

    try {

        const product = await Product
            .findById(req.params.id)
            .populate("seller", "fullName username email");


        if (!product) {

            return res.status(404).json({

                message: "Product not found"

            });

        }


        res.json(product);

    }

    catch (error) {

        res.status(500).json({

            message: error.message

        });

    }

};


// ======================================================
// DELETE PRODUCT
// ======================================================

const deleteProduct = async (req, res) => {

    try {

        await Product.findByIdAndDelete(req.params.id);

        res.json({

            success: true,

            message: "Product deleted"

        });

    }

    catch (error) {

        res.status(500).json({

            message: error.message

        });

    }

};


// ======================================================
// EXPORT CONTROLLERS
// ======================================================

module.exports = {

    createProduct,
    getProducts,
    getProduct,
    deleteProduct

};