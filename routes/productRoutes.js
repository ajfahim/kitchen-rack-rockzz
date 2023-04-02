const express = require('express');
const { getProducts, createProduct, getProduct, updateProduct, deleteProduct, updateProductVariation } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router()

router.route("/")
    .get(protect, getProducts)
    .post(protect, createProduct)
router.route("/:id")
    .get(protect, getProduct)
    .put(protect, updateProduct)
    .delete(protect, deleteProduct)
module.exports = router