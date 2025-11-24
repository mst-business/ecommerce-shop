# E-Commerce Next.js Client

A modern e-commerce frontend built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🛍️ Product browsing and search
- 📦 Shopping cart management
- 📋 Order history
- 👤 User authentication
- 🎨 Modern, responsive UI
- ⚡ Server-side rendering with Next.js

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React** - UI library

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB 6+ running locally (or a cloud MongoDB connection string)

### Environment Variables

Create a `.env` file (or set environment variables) in the project root:

```
MONGO_URI=mongodb://localhost:27017/ecommerce
MONGO_DB_NAME=ecommerce
API_PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the API server in a new terminal:
```bash
npm run api
```

3. In a separate terminal, run the Next.js development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
ecommerce-nextjs/
├── app/                    # Next.js App Router pages (frontend only)
│   ├── page.tsx            # Homepage
│   ├── categories/         # Categories page
│   ├── product/[id]/       # Product details page
│   ├── basket/             # Shopping cart page
│   ├── checkout/           # Checkout page
│   ├── orders/             # Orders page
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   └── admin/              # Admin panel
├── components/            # React components
│   ├── Header.tsx        # Navigation header
│   ├── ProductGrid.tsx   # Product listing grid
│   ├── ProductCard.tsx   # Individual product card
│   └── SearchAndFilters.tsx
├── lib/                   # Frontend utilities (API client, helpers)
├── public/                # Static assets
└── server/                # Standalone Express API (data store + routes)
```

## Backend API

The backend API now runs as a standalone Express server located in `server/`. By default it listens on `http://localhost:3001` and exposes all endpoints under `/api/*`. Update `NEXT_PUBLIC_API_URL` if you need a different origin.

### API Endpoints

- `GET /api/products` - Get all products (with optional filters)
- `GET /api/products/[id]` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

- `GET /api/categories` - Get all categories
- `GET /api/categories/[id]` - Get single category with products
- `POST /api/categories` - Create category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

- `GET /api/orders` - Get user orders (requires auth)
- `GET /api/orders/[id]` - Get single order (requires auth)
- `POST /api/orders` - Create order (requires auth)
- `PUT /api/orders/[id]/status` - Update order status (requires auth)

- `GET /api/cart` - Get user cart (requires auth)
- `POST /api/cart/items` - Add item to cart (requires auth)
- `PUT /api/cart/items/[productId]` - Update cart item (requires auth)
- `DELETE /api/cart/items/[productId]` - Remove item from cart (requires auth)
- `DELETE /api/cart` - Clear cart (requires auth)

- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)

- `GET /api/health` - Health check endpoint

**Note:** Authentication is done via `x-user-id` header. The API uses in-memory storage (replace with database in production).

## Available Pages

- `/` - Homepage with product listing
- `/categories` - Browse by category
- `/product/[id]` - Product details
- `/basket` - Shopping cart
- `/checkout` - Order checkout
- `/orders` - Order history
- `/login` - User login
- `/register` - User registration
- `/admin` - Admin panel

## Development

```bash
# Start the API server
npm run api

# Run the Next.js development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Notes

- The backend API is a separate Express process (`npm run api`)
- Frontend communicates with the API via `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001/api`)
- MongoDB is required; update `MONGO_URI` if you are not using the default local instance
- On first launch, the API seeds example categories/products into MongoDB if the collections are empty
- Authentication uses localStorage for session management
- The API persists data in MongoDB (example products/categories are seeded automatically)
- Remember to run both the API server and the Next.js dev server for local development

