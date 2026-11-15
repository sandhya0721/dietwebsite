# Verdant Bowl — Diet Salad & Membership Platform (MERN Stack)

Full-stack MERN application for **Verdant Bowl**, featuring an artisanal diet salad storefront, live macro & price Salad Builder, Cash on Delivery (COD) checkout for orders and monthly membership subscriptions, automatic daily order scheduling, and role-based Member & Admin dashboards.

## Folder Structure

```text
├── server.ts                          # Express + Vite server entry point (port 3000)
├── server/
│   ├── config/db.ts                   # Embedded local MongoDB via Mongoose (no MONGO_URI required)
│   ├── models/                        # User, Plan, Subscription, Salad, Ingredient, CustomSalad, Order, Payment
│   ├── middleware/                    # JWT auth + role guard + centralized error handler
│   ├── controllers/                   # Business logic for auth, members, plans, salads, orders, subscriptions, COD records
│   ├── routes/                        # Express REST API endpoints (/api/*)
│   ├── utils/subscriptionScheduler.ts # Daily delivery schedule generator
│   └── seed/seedData.ts               # Sample plans, ingredients, salads, and demo accounts
├── src/
│   ├── api/client.ts                  # Configured Axios client with JWT interceptor
│   ├── context/                       # AuthContext & CartContext (Context API)
│   ├── types/index.ts                 # Shared TypeScript interfaces
│   ├── components/                    # Layout, Navbar, SaladCard, SafeImage, ProtectedRoute, ConfirmModal
│   └── pages/                         # Home, Menu, Plans, SaladBuilder, Cart, Checkout, Login, Member & Admin pages
└── package.json
```

## Setup & Run Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables (optional)**
   No `MONGO_URI` is needed—the app automatically runs an embedded local MongoDB instance stored in `.data/mongodb` and seeds sample data on first boot. You may optionally set `JWT_SECRET` in `.env`:
   ```env
   JWT_SECRET="your_jwt_secret"
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

4. **Seed database manually (optional)**
   ```bash
   npm run seed
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Demo Accounts

- **Admin:** `admin@verdantbowl.in` / `Admin@123`
- **Member (Standard Plan):** `member@verdantbowl.in` / `Member@123`
