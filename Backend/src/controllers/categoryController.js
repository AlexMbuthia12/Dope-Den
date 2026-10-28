const Category = require('../models/Category');
const logger = require('../utils/logger');

// Get all categories with hierarchical structure
exports.getCategories = async (req, res, next) => {
  try {
    // Get root categories
    const rootCategories = await Category.find({ parent: null });

    // Build hierarchical structure
    const buildHierarchy = async (categories) => {
      return Promise.all(
        categories.map(async (cat) => {
          const children = await Category.find({ parent: cat._id });
          return {
            _id: cat._id,
            name: cat.name,
            slug: cat.slug,
            children: await buildHierarchy(children),
          };
        })
      );
    };

    const hierarchicalCategories = await buildHierarchy(rootCategories);

    res.status(200).json(hierarchicalCategories);
  } catch (error) {
    logger.error(`Error fetching categories: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error fetching categories',
      error: error.message,
    });
  }
};

// Create category (admin only)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, slug, parent } = req.body;

    if (!name) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Category name is required.',
      });
    }

    const category = new Category({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      parent: parent || null,
    });

    await category.save();

    res.status(201).json({
      statusCode: 201,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    logger.error(`Error creating category: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error creating category',
      error: error.message,
    });
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const category = await Category.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!category) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    logger.error(`Error updating category: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error updating category',
      error: error.message,
    });
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Category not found',
      });
    }

    if (category.slug === 'shoes' || category.slug === 'sneakers' || category.slug === 'sandals') {
      return res.status(400).json({
        statusCode: 400,
        message: 'The shoes category cannot be deleted.',
      });
    }

    const deleteResult = await Category.findByIdAndDelete(id);
    if (!deleteResult) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Category not found',
      });
    }

    await Category.deleteMany({ parent: id });

    res.status(200).json({
      statusCode: 200,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    logger.error(`Error deleting category: ${error.message}`);
    res.status(500).json({
      statusCode: 500,
      message: 'Error deleting category',
      error: error.message,
    });
  }
};
