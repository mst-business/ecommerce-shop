const Category = require('../models/Category');
const Product = require('../models/Product');
const { exampleCategories, exampleProducts } = require('../data/examples');
const Counter = require('../models/Counter');

async function ensureCounterValue(key, minValue) {
  await Counter.findOneAndUpdate(
    { key },
    { $max: { value: minValue } },
    { upsert: true }
  );
}

async function seedExampleData() {
  const categoryCount = await Category.countDocuments();
  if (categoryCount === 0) {
    await Category.insertMany(exampleCategories);
    const maxCategoryId = Math.max(...exampleCategories.map((c) => c.id));
    await ensureCounterValue('category', maxCategoryId + 1);
  }

  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    await Product.insertMany(exampleProducts);
    const maxProductId = Math.max(...exampleProducts.map((p) => p.id));
    await ensureCounterValue('product', maxProductId + 1);
  }
}

module.exports = {
  seedExampleData,
};


