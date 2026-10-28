# E-Commerce Backend API (MERN Stack)

A robust, scalable Node.js + Express.js + MongoDB backend API for an e-commerce clothing store.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm** or **yarn**
- **MongoDB** 6.x (local or cloud instance)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ecommerce-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your configuration
```

### Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

---

## 📂 Project Structure

```
src/
├── config/
│   └── database.js         # MongoDB connection
├── controllers/
│   ├── productController.js
│   ├── categoryController.js
│   ├── cartController.js
│   ├── authController.js
│   └── userController.js
├── models/
│   ├── User.js
│   ├── Product.js
│   ├── Category.js
│   └── Cart.js
├── routes/
│   ├── productRoutes.js
│   ├── categoryRoutes.js
│   ├── cartRoutes.js
│   ├── authRoutes.js
│   └── userRoutes.js
├── middleware/
│   ├── auth.js             # JWT authentication
│   └── errorHandler.js     # Global error handling
├── utils/
│   └── logger.js           # Winston logger
├── app.js                  # Express app setup
└── server.js               # Server entry point
```

---

## 🔌 API Endpoints

### Products
- `GET /api/v1/products` - Get all products (with filtering, sorting, pagination)
- `GET /api/v1/products/:id` - Get product details
- `POST /api/v1/products` - Create product (admin only)
- `PUT /api/v1/products/:id` - Update product (admin only)
- `DELETE /api/v1/products/:id` - Delete product (admin only)

### Categories
- `GET /api/v1/categories` - Get all categories (hierarchical)
- `POST /api/v1/categories` - Create category (admin only)

### Cart (Requires Authentication)
- `GET /api/v1/cart` - Get user's cart
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/:itemId` - Update item quantity
- `DELETE /api/v1/cart/items/:itemId` - Remove item from cart

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Users (Requires Authentication)
- `GET /api/v1/users/me` - Get user profile
- `PUT /api/v1/users/me` - Update user profile

---

## 🔐 Authentication

The API uses **JWT (JSON Web Tokens)** for authentication.

### How to Authenticate

1. **Register** or **Login** to get a token:
   ```bash
   POST /api/v1/auth/login
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

2. **Include the token** in the `Authorization` header:
   ```
   Authorization: Bearer <your_jwt_token>
   ```

---

## 🗄️ Database Models

### User
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: String ('user' | 'admin'),
  createdAt: Date,
  updatedAt: Date
}
```

### Product
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  originalPrice: Number,
  discount: String,
  category: ObjectId (ref: Category),
  images: [String],
  sizes: [String],
  colors: [String],
  stock: Number,
  isFeatured: Boolean,
  brand: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Category
```javascript
{
  _id: ObjectId,
  name: String (unique),
  slug: String (unique),
  parent: ObjectId (ref: Category, optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Cart
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  items: [
    {
      product: ObjectId (ref: Product),
      quantity: Number,
      price: Number,
      size: String,
      color: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔍 Query Parameters

### Product Listing (`GET /api/v1/products`)

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `page` | Number | Page number (default: 1) |
| `limit` | Number | Items per page (default: 10) |
| `category` | String | Filter by category ID or slug |
| `size` | String | Filter by size |
| `color` | String | Filter by color |
| `minPrice` | Number | Minimum price filter |
| `maxPrice` | Number | Maximum price filter |
| `sort` | String | Sort order (e.g., `price_asc`, `price_desc`, `createdAt_desc`) |
| `search` | String | Keyword search |

**Example:**
```
GET /api/v1/products?page=1&limit=10&category=dresses&minPrice=20&maxPrice=100&sort=price_asc
```

---

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug

# Password Hashing
BCRYPT_ROUNDS=10
```

---

## 🧪 Testing

```bash
# Run tests
npm test
```

---

## 📚 API Documentation

For detailed API documentation, visit:
- **Swagger/OpenAPI** (if implemented): `http://localhost:5000/api-docs`
- **Postman Collection**: Available in the `postman/` directory

---

## 🛠️ Development

### Adding a New Endpoint

1. Create a controller in `src/controllers/`
2. Create a route in `src/routes/`
3. Import and use the route in `src/app.js`

### Adding a New Model

1. Create a schema in `src/models/`
2. Use it in controllers and routes

---

## 🚀 Deployment

### Docker

```bash
# Build Docker image
docker build -t ecommerce-backend .

# Run container
docker run -p 5000:5000 --env-file .env ecommerce-backend
```

### Cloud Platforms

- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo and deploy
- **Render**: Connect GitHub repo and deploy
- **AWS**: Use Elastic Beanstalk or EC2

---

## 📖 Additional Resources

- [Express.js Documentation](https://expressjs.com)
- [Mongoose Documentation](https://mongoosejs.com)
- [JWT Documentation](https://jwt.io)
- [MongoDB Documentation](https://docs.mongodb.com)

---

## 📄 License

This project is licensed under the ISC License.

---

## 🤝 Contributing

Contributions are welcome! Please follow the existing code style and create a pull request.

---

## 📞 Support

For issues or questions, please open an issue in the GitHub repository.
