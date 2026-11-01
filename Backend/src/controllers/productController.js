const Product = require('../models/Product');
const Category = require('../models/Category');
const logger = require('../utils/logger');

// Get all products with filtering, sorting, and pagination
exports.getProducts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 69, 
      category, 
      size, 
      color, 
      minPrice, 
      maxPrice, 
      sort = 'createdAt_desc', 
      search, 
      status, 
      section 
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'sold' };
    }

    if (category) {
      filter.category = category;
    }

    if (section) {
      filter.section = section;
    }

    if (size) {
      filter.sizes = { $in: Array.isArray(size) ? size : [size] };
    }

    if (color) {
      filter.colors = { $in: Array.isArray(color) ? color : [color] };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Parse sort parameter
    const sortObj = {};
    const [sortField, sortOrder] = sort.split('_');
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    
    // ENFORCE HARD CAP: Max 69 items per request (24 catalog + 45 deals limit)
    const MAX_ALLOWED_LIMIT = 69; // 24 + 45
    const requestedLimit = parseInt(limit, 10) || 69;
    const limitNum = Math.min(Math.max(1, requestedLimit), MAX_ALLOWED_LIMIT);
    
    const skip = (pageNum - 1) * limitNum;

    // Execute query with max cap enforced
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Get total count for metadata
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limitNum);

    res.status(200).json({
      products,
      totalProducts,
      totalPages,
      currentPage: pageNum,
      limitApplied: limitNum,
    });
  } catch (error) {
    logger.error(`Error fetching products: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching products',
      error: error.message,
    });
  }
};

// Get single product by ID
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Product not found',
      });
    }

    res.status(200).json(product);
  } catch (error) {
    logger.error(`Error fetching product: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching product',
      error: error.message,
    });
  }
};

// Create product (admin only)
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, originalPrice, discount, category, images, sizes, colors, stock, brand, status, section } = req.body;

    const categoryValue = typeof category === 'string' ? category : category?.toString();

    if (!categoryValue) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Category is required.',
      });
    }

    let categoryExists = await Category.findById(categoryValue);
    if (!categoryExists) {
      categoryExists = await Category.findOne({ slug: categoryValue.toLowerCase().replace(/\s+/g, '-') });
    }

    if (!categoryExists) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Category not found. Create it from the admin category settings first.',
      });
    }

    const product = new Product({
      name,
      description,
      price,
      originalPrice,
      discount,
      category: categoryExists._id,
      images: Array.isArray(images) ? images : [],
      sizes: Array.isArray(sizes) ? sizes : [],
      colors: Array.isArray(colors) ? colors : [],
      stock,
      brand,
      status: status || 'active',
      section: section || 'catalog', // Default to 'catalog' if not provided
    });

    await product.save();

    res.status(201).json({
      statusCode: 201,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    logger.error(`Error creating product: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error creating product',
      error: error.message,
    });
  }
};

// Update product (admin only)
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    logger.error(`Error updating product: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error updating product',
      error: error.message,
    });
  }
};

// Delete product (admin only)
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    logger.error(`Error deleting product: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error deleting product',
      error: error.message,
    });
  }
};
