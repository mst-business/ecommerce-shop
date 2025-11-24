// Example categories and products for the standalone API server

const exampleCategories = [
  {
    id: 1,
    name: 'Clothing',
    description: 'Apparel and clothing items',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Footwear',
    description: 'Shoes and boots',
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Accessories',
    description: 'Fashion accessories',
    createdAt: new Date().toISOString(),
  },
];

const exampleProducts = [
  {
    id: 1,
    name: 'T-shirt',
    price: 19.99,
    description: 'Comfortable cotton t-shirt in various colors',
    categoryId: 1,
    stock: 50,
    image: '/images/tshirt.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Jeans',
    price: 49.99,
    description: 'Classic blue jeans with perfect fit',
    categoryId: 1,
    stock: 30,
    image: '/images/jeans.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Sneakers',
    price: 89.99,
    description: 'Running sneakers with cushioned sole',
    categoryId: 2,
    stock: 25,
    image: '/images/sneakers.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Boots',
    price: 129.99,
    description: 'Durable leather boots for all weather',
    categoryId: 2,
    stock: 20,
    image: '/images/boots.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Jacket',
    price: 79.99,
    description: 'Warm winter jacket with hood',
    categoryId: 1,
    stock: 15,
    image: '/images/jacket.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'Cap',
    price: 24.99,
    description: 'Stylish baseball cap with adjustable strap',
    categoryId: 3,
    stock: 40,
    image: '/images/cap.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 7,
    name: 'Backpack',
    price: 59.99,
    description: 'Spacious backpack with multiple compartments',
    categoryId: 3,
    stock: 18,
    image: '/images/backpack.jpg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 8,
    name: 'Socks',
    price: 9.99,
    description: 'Comfortable cotton socks pack of 3',
    categoryId: 3,
    stock: 60,
    image: '/images/socks.jpg',
    createdAt: new Date().toISOString(),
  },
];

module.exports = {
  exampleCategories,
  exampleProducts,
};




