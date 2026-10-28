const Category = require('../models/Category');

const defaultCategoryTree = [
  {
    name: 'Clothes',
    slug: 'clothes',
    children: [
      { name: 'T-Shirts', slug: 't-shirts' },
      { name: 'Shirts', slug: 'shirts' },
      { name: 'Jeans', slug: 'jeans' },
      { name: 'Jackets', slug: 'jackets' },
      { name: 'Hoodies', slug: 'hoodies' },
    ],
  },
  {
    name: 'Shoes',
    slug: 'shoes',
    children: [
      { name: 'Sneakers', slug: 'sneakers' },
      { name: 'Sandals', slug: 'sandals' },
    ],
  },
  {
    name: 'Jewellery',
    slug: 'jewellery',
    children: [
      { name: 'Chains', slug: 'chains' },
      { name: 'Bracelets', slug: 'bracelets' },
      { name: 'Watches', slug: 'watches' },
      { name: 'Iced Watches', slug: 'iced-watches' },
    ],
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    children: [
      { name: 'Belts', slug: 'belts' },
      { name: 'Waist Bags', slug: 'waist-bags' },
      { name: 'Bags', slug: 'bags' },
    ],
  },
  {
    name: 'Perfumes',
    slug: 'perfumes',
    children: [],
  },
];

const createCategoryTree = async (tree, parentId = null) => {
  for (const item of tree) {
    const category = await Category.findOne({ slug: item.slug });

    if (!category) {
      const newCategory = await Category.create({
        name: item.name,
        slug: item.slug,
        parent: parentId,
      });

      if (item.children?.length) {
        await createCategoryTree(item.children, newCategory._id);
      }
      continue;
    }

    if (item.children?.length) {
      await createCategoryTree(item.children, category._id);
    }
  }
};

const seedDefaultCategories = async () => {
  const total = await Category.countDocuments();
  if (total > 0) return;

  await createCategoryTree(defaultCategoryTree);
};

module.exports = { defaultCategoryTree, seedDefaultCategories };