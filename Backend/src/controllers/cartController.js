const Cart = require('../models/Cart');
const Product = require('../models/Product');
const logger = require('../utils/logger');

// Get user's cart
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.userId;

    let cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }

    // Calculate total price
    const totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

    res.status(200).json({
      ...cart.toObject(),
      totalPrice: Math.round(totalPrice * 100) / 100,
    });
  } catch (error) {
    logger.error(`Error fetching cart: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching cart',
      error: error.message,
    });
  }
};

// Add item to cart
exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { productId, quantity, size, color } = req.body;

    // Validate input
    if (!productId || !quantity) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Product ID and quantity are required',
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Product not found',
      });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(409).json({
        statusCode: 409,
        message: 'Insufficient stock',
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already in cart
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId && item.size === size && item.color === color
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
        size,
        color,
      });
    }

    await cart.save();
    await cart.populate('items.product');

    const totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

    res.status(200).json({
      statusCode: 200,
      message: 'Item added to cart',
      cart: {
        ...cart.toObject(),
        totalPrice: Math.round(totalPrice * 100) / 100,
      },
    });
  } catch (error) {
    logger.error(`Error adding to cart: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error adding to cart',
      error: error.message,
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    // Validate input
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Quantity must be at least 1',
      });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Cart not found',
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Item not found in cart',
      });
    }

    // Check stock
    const product = await Product.findById(item.product);
    if (product.stock < quantity) {
      return res.status(409).json({
        statusCode: 409,
        message: 'Insufficient stock',
      });
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product');

    const totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

    res.status(200).json({
      statusCode: 200,
      message: 'Cart item updated',
      cart: {
        ...cart.toObject(),
        totalPrice: Math.round(totalPrice * 100) / 100,
      },
    });
  } catch (error) {
    logger.error(`Error updating cart item: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error updating cart item',
      error: error.message,
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Cart not found',
      });
    }

    cart.items.id(itemId).deleteOne();
    await cart.save();
    await cart.populate('items.product');

    const totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

    res.status(200).json({
      statusCode: 200,
      message: 'Item removed from cart',
      cart: {
        ...cart.toObject(),
        totalPrice: Math.round(totalPrice * 100) / 100,
      },
    });
  } catch (error) {
    logger.error(`Error removing from cart: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error removing from cart',
      error: error.message,
    });
  }
};
