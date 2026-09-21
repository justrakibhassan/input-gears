# ⚡ Input Gears - Premium Tech Gadget Store

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-latest-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-blueviolet?style=for-the-badge&logo=stripe)](https://stripe.com/)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=vercel)](https://inputgears.vercel.app/)

Welcome to **Input Gears**, a high-performance e-commerce platform built for tech and peripheral enthusiasts. Experience a seamless shopping journey with instant product search, robust inventory management, and secure Stripe payment processing.

---

## 🔗 Live Experience

- **Live Store:** [inputgears.vercel.app](https://inputgears.vercel.app/)

---

## 📸 Visual Preview

<div align="center">
  <img src="public/input-gears.webp" alt="Input Gears Homepage" width="100%" style="border-radius: 12px; margin-bottom: 20px;" />
</div>

---

## 🚀 Core Features

### 🛒 E-Commerce Excellence
- **Dynamic Product Catalog**: Instant search, category filtering, and responsive inventory display.
- **Persistent Cart Experience**: Real-time cart state synchronization across page navigations with animated toast notifications.
- **Smart Checkout Flow**: Integrated Stripe payment processing for fast, PCI-compliant transactions.
- **Order Tracking**: Real-time status lifecycle management from "Pending" to "Delivered".

### 🔐 Multi-Role Authentication & Security
- **Modern Auth Architecture**: Powered by **Better Auth** for secure session management and data isolation.
- **Customer Dashboard**: Profile management, saved shipping addresses, and comprehensive order history.

### 🛠️ Professional Admin Suite
- **Inventory Control**: Real-time CRUD operations for products with Cloudinary integration for optimized image delivery.
- **Dynamic Marketing CMS**: Manage hero sliders and site-wide promotional banners dynamically.
- **Order Fulfillment**: Dedicated admin control center to review, update, and manage customer shipments.

### 🎨 Design & UI Architecture
- **Tailwind CSS v4**: Fluid, responsive, and performance-first styling engine.
- **Glassmorphism Accents**: Subtle background blurs and border highlights for a refined hardware aesthetic.
- **Dual-Mode Theming**: Native dark and light mode support with smooth transitions.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router, React 19) | Server components, Server Actions, Edge caching |
| **Styling** | Tailwind CSS v4, Radix UI | Modern responsive UI primitives |
| **Database** | PostgreSQL with Prisma ORM | Relational data persistence & migrations |
| **Auth** | Better Auth | Session tokens and role-based permissions |
| **Payments** | Stripe API | Secure card checkout & payment intents |
| **State** | Zustand | Lightweight client-side cart and preference state |
| **Media** | Cloudinary CDN | Asset optimization and cloud image hosting |
| **Validation** | React Hook Form & Zod | End-to-end schema validation |

---

## 📥 Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Stripe & Cloudinary developer accounts

### 1. Clone & Install

```bash
git clone https://github.com/justrakibhassan/input-gears.git
cd input-gears
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
DATABASE_URL="your_postgresql_connection_string"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
STRIPE_SECRET_KEY="your_stripe_secret_key"
BETTER_AUTH_SECRET="your_auth_secret"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### 3. Database Migration & Run

```bash
npx prisma db push
npm run dev
```

---

## 📄 License

Distributed under the MIT License.

---

## 👨‍💻 Author

Designed and engineered with passion by [Rakib Hassan](https://rakibhassan.vercel.app).
