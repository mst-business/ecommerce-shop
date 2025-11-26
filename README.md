# 🛒 StoreHub - Modern E-Commerce Platform

A full-stack e-commerce application built with Next.js and Express.js, featuring a modern UI, comprehensive admin dashboard, and robust API.

![Next.js](https://img.shields.io/badge/Next.js-14.0-black?logo=next.js)
![Express.js](https://img.shields.io/badge/Express.js-4.19-green?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green?logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC?logo=tailwind-css)

## 📋 Table of Contents

- [Project Description](#-project-description)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [Demo Credentials](#-demo-credentials)
- [API Documentation](#-api-documentation)
- [Deployment Guide](#-deployment-guide)
- [Project Structure](#-project-structure)

---

## 📖 Project Description

StoreHub is a modern, full-featured e-commerce platform that provides:

- **Customer Experience**: Browse products, manage cart, checkout (with guest option), track orders, rate products
- **Admin Dashboard**: Manage products, categories, orders, and customers with analytics
- **Security**: JWT authentication, rate limiting, XSS protection, input sanitization
- **Modern UI**: Responsive design with Fresh Mint theme, toast notifications, loading states

### Key Highlights

- 🛍️ **Guest Checkout** - Purchase without creating an account
- ⭐ **Product Ratings** - Rate and review products with filtering
- 📊 **Admin Analytics** - Sales trends, top products, order statistics
- 🔒 **Role-Based Access** - Customer and Admin roles with protected routes
- 🎨 **Modern Design** - Clean, responsive UI with smooth animations

---

## ✨ Features

### Customer Features
- [x] Product browsing with search and filters
- [x] Category-based navigation
- [x] Shopping cart management
- [x] Guest checkout (no login required)
- [x] User registration and authentication
- [x] Order tracking and history
- [x] Product ratings and reviews
- [x] User profile management
- [x] Wishlist (model ready)
- [x] Responsive design

### Admin Features
- [x] Dashboard with analytics
- [x] Product management (CRUD)
- [x] Category management
- [x] Order management with status updates
- [x] Customer management
- [x] Bulk product actions
- [x] Stock management
- [x] Sales reports

### Security Features
- [x] JWT authentication
- [x] Rate limiting (API, Auth, Admin)
- [x] XSS protection
- [x] NoSQL injection prevention
- [x] HTTP security headers (Helmet)
- [x] Input sanitization
- [x] Request logging

### Bonus Features
- [x] Coupon/Discount system (model ready)
- [x] Order status history tracking
- [x] Inventory tracking with history
- [x] Soft delete for data recovery
- [x] Email-ready order confirmations
- [x] Cart abandonment tracking

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.0 | React framework with App Router |
| React | 18.2 | UI library |
| TypeScript | 5.0 | Type safety |
| Tailwind CSS | 3.3 | Styling |
| React Context | - | State management |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Express.js | 4.19 | API framework |
| MongoDB | - | Database |
| Mongoose | 8.7 | ODM |
| JWT | - | Authentication |
| bcrypt | 5.1 | Password hashing |

### Security Packages
| Package | Purpose |
|---------|---------|
| helmet | Security headers |
| express-rate-limit | Rate limiting |
| express-mongo-sanitize | NoSQL injection prevention |
| hpp | HTTP parameter pollution |
| jsonwebtoken | JWT tokens |

---

## 📦 Installation

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local installation or MongoDB Atlas account

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd ecommerce-nextjs
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# API Configuration
API_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Frontend
FRONTEND_ORIGIN=http://localhost:3000

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
NODE_ENV=development

# Optional: Admin IP Whitelist (comma-separated)
# ADMIN_IP_WHITELIST=127.0.0.1,192.168.1.100
```

### Step 4: Database Setup

**Option A: MongoDB Atlas (Recommended)**
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Get connection string and add to `.env`

**Option B: Local MongoDB**
```bash
# Start MongoDB locally
mongod

# Use local connection string
MONGODB_URI=mongodb://localhost:27017/ecommerce
```

### Step 5: Seed Initial Data

The application automatically seeds example data on first run. To manually seed:

```bash
# Run the API server (seeds automatically)
npm run api

# Or run specific scripts
node scripts/setup-admin-user.js  # Create admin user
node scripts/migrate-database.js  # Run migrations
```

---

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend API:**
```bash
npm run api
```
API will run at: `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend will run at: `http://localhost:3000`

### Production Mode

```bash
# Build the frontend
npm run build

# Start production server
npm start

# Run API separately
npm run api
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run api` | Start Express API server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🔑 Demo Credentials

### Customer Account
```
Username: customer
Password: password123
Email: customer@example.com
```

### Admin Account
```
Username: admin
Password: admin123
Email: admin@example.com
```

### Creating an Admin User

Run the setup script:
```bash
node scripts/setup-admin-user.js
```

Or manually via MongoDB:
```javascript
db.users.updateOne(
  { username: "your-username" },
  { $set: { role: "admin" } }
)
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication
Include user ID in headers:
```
x-user-id: <user-id>
```

Or use JWT token:
```
Authorization: Bearer <access-token>
```

### Endpoints Overview

#### Products
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/products` | List products with filters | No |
| GET | `/products/:id` | Get product details | No |
| POST | `/products` | Create product | Admin |
| PUT | `/products/:id` | Update product | Admin |
| DELETE | `/products/:id` | Delete product | Admin |

**Example: Get Products with Filters**
```bash
GET /api/products?categoryId=1&minPrice=10&maxPrice=100&search=phone&minRating=4&sortBy=rating&page=1&limit=12
```

#### Categories
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/categories` | List all categories | No |
| GET | `/categories/:id` | Get category with products | No |
| POST | `/categories` | Create category | Admin |
| PUT | `/categories/:id` | Update category | Admin |
| DELETE | `/categories/:id` | Delete category | Admin |

#### Cart
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/cart` | Get user's cart | Yes |
| POST | `/cart/items` | Add item to cart | Yes |
| PUT | `/cart/items/:productId` | Update quantity | Yes |
| DELETE | `/cart/items/:productId` | Remove item | Yes |
| DELETE | `/cart` | Clear cart | Yes |

**Example: Add to Cart**
```bash
POST /api/cart/items
Content-Type: application/json
x-user-id: 1

{
  "productId": 1,
  "quantity": 2
}
```

#### Orders
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/orders` | Get user's orders | Yes |
| GET | `/orders/:id` | Get order details | Yes |
| POST | `/orders` | Create order | Yes |
| POST | `/orders/guest` | Create guest order | No |
| GET | `/orders/guest/:id?email=` | Get guest order | No |

**Example: Create Order**
```bash
POST /api/orders
Content-Type: application/json
x-user-id: 1

{
  "items": [
    { "productId": 1, "quantity": 2 }
  ],
  "shippingAddress": {
    "fullName": "John Doe",
    "addressLine1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "credit_card"
}
```

#### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/users/register` | Register new user | No |
| POST | `/users/login` | Login | No |
| POST | `/users/refresh-token` | Refresh JWT | No |
| GET | `/users/profile` | Get profile | Yes |
| PUT | `/users/profile` | Update profile | Yes |
| PUT | `/users/password` | Change password | Yes |

**Example: Login**
```bash
POST /api/users/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Login successful"
}
```

#### Ratings
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/products/:id/ratings` | Get product ratings | No |
| POST | `/products/:id/ratings` | Add/update rating | Yes |
| GET | `/products/:id/my-rating` | Get user's rating | Yes |
| DELETE | `/products/:id/ratings` | Delete rating | Yes |

#### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/stats` | Dashboard statistics | Admin |
| GET | `/admin/orders` | All orders | Admin |
| GET | `/admin/customers` | All customers | Admin |
| GET | `/admin/products` | All products (inc. inactive) | Admin |
| PUT | `/admin/products/bulk` | Bulk activate/deactivate | Admin |
| PUT | `/admin/products/:id/stock` | Update stock | Admin |

#### Health Check
```bash
GET /api/health
```

---

## 🌐 Deployment Guide

### Vercel (Frontend)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
   ```
4. Deploy

### Railway/Render (Backend)

1. Create new project
2. Connect GitHub repository
3. Set environment variables:
   ```
   MONGODB_URI=your-mongodb-uri
   JWT_SECRET=your-jwt-secret
   FRONTEND_ORIGIN=https://your-frontend-domain.com
   NODE_ENV=production
   ```
4. Deploy

### Docker (Optional)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 3001
CMD ["node", "server/index.js"]
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Configure MongoDB Atlas with IP whitelist
- [ ] Enable HTTPS
- [ ] Set proper `FRONTEND_ORIGIN` for CORS
- [ ] Run database migrations
- [ ] Create admin user

---

## 📁 Project Structure

```
ecommerce-nextjs/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard pages
│   ├── basket/             # Shopping cart
│   ├── categories/         # Category browsing
│   ├── checkout/           # Checkout flow
│   ├── login/              # Authentication
│   ├── orders/             # Order history
│   ├── product/[id]/       # Product details
│   ├── profile/            # User profile
│   └── ...
├── components/             # React components
│   ├── ui/                 # Reusable UI components
│   ├── Header.tsx
│   ├── ProductCard.tsx
│   └── ...
├── contexts/               # React Context providers
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   └── ToastContext.tsx
├── lib/                    # Utilities and helpers
│   ├── api-client.ts       # API client
│   ├── validation.ts       # Form validation
│   ├── errors.ts           # Error handling
│   └── ...
├── server/                 # Express.js backend
│   ├── config/             # Database & security config
│   ├── middleware/         # Auth, validation, security
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── utils/              # Server utilities
│   └── index.js            # Server entry point
├── scripts/                # Database scripts
│   ├── migrate-database.js
│   ├── backup-database.js
│   └── setup-admin-user.js
├── public/                 # Static assets
└── ...
```

---

## 🔧 Environment Variables Reference

```env
# Required
MONGODB_URI=                    # MongoDB connection string
JWT_SECRET=                     # JWT signing secret (32+ chars)

# Optional (with defaults)
API_PORT=3001                   # API server port
NEXT_PUBLIC_API_URL=http://localhost:3001/api
FRONTEND_ORIGIN=http://localhost:3000
NODE_ENV=development            # development | production

# Optional Security
ADMIN_IP_WHITELIST=             # Comma-separated IPs for admin access
```

---

## 📝 Database Seeding

The application seeds example data automatically on first run:

- **5 Categories**: Electronics, Clothing, Books, Home, Sports
- **20 Products**: Various items across categories
- **Demo Users**: customer and admin accounts

To re-seed or add more data:

```bash
# Create/promote admin user
node scripts/setup-admin-user.js

# Run database migrations
node scripts/migrate-database.js

# Backup before major changes
node scripts/backup-database.js
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Express.js](https://expressjs.com/) - API framework

---

**Built with ❤️ using Next.js and Express.js**
