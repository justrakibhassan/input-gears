// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding categories and products...");

  // Delete existing data in correct order
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.heroSlide.deleteMany();

  // 1. Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Keyboards",
        slug: "keyboards",
        description: "Mechanical, membrane, and custom keyboards.",
        isFeatured: true,
      },
    }),
    prisma.category.create({
      data: {
        name: "Mice",
        slug: "mice",
        description: "Gaming and productivity mice.",
        isFeatured: true,
      },
    }),
    prisma.category.create({
      data: {
        name: "Audio",
        slug: "audio",
        description: "Headsets and headphones.",
        isFeatured: true,
      },
    }),
    prisma.category.create({
      data: {
        name: "Monitors",
        slug: "monitors",
        description: "High-refresh rate and 4K monitors.",
        isFeatured: true,
      },
    }),
    prisma.category.create({
      data: {
        name: "Accessories",
        slug: "accessories",
        description: "Hubs, mouse pads, and more.",
        isFeatured: true,
      },
    }),
  ]);

  const [kbdCat, miceCat, audioCat, monCat, accCat] = categories;

  // 2. Create Products associated with Categories
  await prisma.product.createMany({
    data: [
      {
        id: "prod_keyboard_x1",
        name: "Mechanical Keyboard X1",
        slug: "mechanical-keyboard-x1",
        description: "Premium mechanical keyboard with RGB backlighting.",
        price: 120.0,
        stock: 50,
        image: "/product-keyboard.png",
        colors: ["#000000", "#FFFFFF", "#FF3366"],
        switchType: "Linear",
        brand: "GearsPro",
        sku: "GP-KBD-X1",
        weight: "1.2kg",
        connectionType: "Wired (USB-C)",
        pollingRate: "1000Hz",
        warranty: "2 Years",
        availability: "In Stock",
        categoryId: kbdCat.id,
      },
      {
        id: "prod_keyboard_logi",
        name: "Logitech G Pro X",
        slug: "logitech-g-pro-x",
        description: "The pro-grade keyboard with swappable switches.",
        price: 149.99,
        stock: 45,
        image: "https://images.unsplash.com/photo-1595044426077-d36d93375ea4?w=800&auto=format&fit=crop&q=60",
        colors: ["#000000"],
        switchType: "GX Blue Clicky",
        brand: "Logitech",
        sku: "LOGI-GPROX",
        connectionType: "Wired",
        categoryId: kbdCat.id,
      },
      {
        id: "prod_mouse_wireless",
        name: "Wireless Gaming Mouse",
        slug: "wireless-gaming-mouse",
        description: "Ultra-fast response time with 25k DPI sensor.",
        price: 85.5,
        stock: 30,
        image: "/product-mouse.png",
        colors: ["#000000", "#808080", "#FFD700"],
        brand: "SwiftMove",
        sku: "SM-MSE-W1",
        dpi: "25600 DPI",
        weight: "63g",
        connectionType: "Wireless 2.4GHz / Wired",
        pollingRate: "4000Hz (Dongle)",
        sensor: "HERO 25K",
        warranty: "1 Year",
        availability: "In Stock",
        categoryId: miceCat.id,
      },
      {
        id: "prod_mouse_razer",
        name: "Razer DeathAdder V3 Pro",
        slug: "razer-deathadder-v3-pro",
        description: "Ultra-lightweight wireless ergonomic mouse.",
        price: 149.0,
        stock: 20,
        image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=60",
        brand: "Razer",
        sku: "RAZ-DV3P",
        dpi: "30000 DPI",
        categoryId: miceCat.id,
      },
      {
        id: "prod_headphones_anc",
        name: "Noise Cancelling Headphones",
        slug: "noise-cancelling-headphones",
        description: "Immersive sound experience with active noise cancellation.",
        price: 250.0,
        stock: 15,
        image: "/product-headphones.png",
        colors: ["#000000", "#000080"],
        brand: "AudioPure",
        sku: "AP-HDP-ANC",
        weight: "250g",
        connectionType: "Bluetooth 5.2 / 3.5mm",
        pollingRate: "N/A",
        warranty: "1 Year",
        availability: "Limited Stock",
        categoryId: audioCat.id,
      },
      {
        id: "prod_monitor_4k",
        name: "4K Monitor 27-inch",
        slug: "4k-monitor-27-inch",
        description: "Crystal clear display tailored for designers.",
        price: 450.0,
        stock: 10,
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=60",
        colors: ["#000000", "#C0C0C0"],
        brand: "VisionMaster",
        sku: "VM-MON-4K27",
        weight: "5.5kg",
        connectionType: "HDMI 2.1 / DP 1.4",
        warranty: "3 Years",
        availability: "In Stock",
        categoryId: monCat.id,
      },
      {
        id: "prod_hub_usbc",
        name: "USB-C Hub Multiport",
        slug: "usb-c-hub-multiport",
        description: "Expand your connectivity with 7 ports.",
        price: 45.0,
        stock: 100,
        image: "https://images.unsplash.com/photo-1622359556214-415510b65637?w=800&auto=format&fit=crop&q=60",
        colors: ["#808080", "#FFFFFF"],
        brand: "ConnectIt",
        sku: "CI-HUB-7P",
        warranty: "1 Year",
        availability: "In Stock",
        categoryId: accCat.id,
      },
      {
        id: "prod_mousepad_xl",
        name: "Gaming Mouse Pad XL",
        slug: "gaming-mouse-pad-xl",
        description: "Smooth surface for precise control.",
        price: 25.0,
        stock: 150,
        image: "https://images.unsplash.com/photo-1610444569503-4f514603952f?w=800&auto=format&fit=crop&q=60",
        colors: ["#000000", "#32CD32"],
        brand: "SwiftPad",
        sku: "SP-MPD-XL",
        warranty: "6 Months",
        availability: "In Stock",
        categoryId: accCat.id,
      },
    ],
  });

  // 3. Create Site Settings
  await prisma.siteSettings.upsert({
    where: { id: "general" },
    create: {
      id: "general",
      topBarText: "🚀 Welcome to Input Gears - Your Premium Gear Shop!",
      topBarActive: true,
      maintenanceMode: false,
    },
    update: {},
  });

  // 4. Create Hero Slides
  await prisma.heroSlide.createMany({
    data: [
      {
        title: "Ultimate Mechanical Experience",
        subtitle: "Premium Keyboards for Enthusiasts",
        image: "/hero-keyboard.png",
        order: 1,
      },
      {
        title: "Wireless Precision",
        subtitle: "Ultra-Lightweight Gaming Mice",
        image: "/hero-mouse.png",
        order: 2,
      },
      {
        title: "Elite Workspaces",
        subtitle: "High-Performance Productivity Setups",
        image: "/hero-setup.png",
        order: 3,
      },
    ],
  });

  console.log("✅ Seeding completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
