const express = require("express");
const router  = express.Router();
const upload  = require("../config/multer");
const authMiddleware = require("../middleware/authmiddleware");
const {
    createProduct,
    getProducts,
    getProduct,
    deleteProduct
} = require("../controllers/productController");

// CREATE — accepts both image and video fields
router.post("/", authMiddleware, upload.fields([
    { name: "image", maxCount: 1 },
    { name: "reelVideo", maxCount: 1 }
]), createProduct);

// GET ALL
router.get("/", getProducts);

// GET ONE
router.get("/:id", getProduct);

// DELETE
router.delete("/:id", authMiddleware, deleteProduct);

module.exports = router;