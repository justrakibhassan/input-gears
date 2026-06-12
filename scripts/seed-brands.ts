import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const brands = [
  { name: "RAZER", image: "https://upload.wikimedia.org/wikipedia/en/thumb/4/40/Razer_snake_logo.svg/1200px-Razer_snake_logo.svg.png", isActive: true, order: 1 },
  { name: "LOGITECH", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Logitech_logo.svg/1200px-Logitech_logo.svg.png", isActive: true, order: 2 },
  { name: "CORSAIR", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Corsair_Memory_Logo.svg/1200px-Corsair_Memory_Logo.svg.png", isActive: true, order: 3 },
  { name: "STEELSERIES", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/SteelSeries_logo.svg/1200px-SteelSeries_logo.svg.png", isActive: true, order: 4 },
  { name: "ASUS ROG", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/ASUS_ROG_logo.svg/1200px-ASUS_ROG_logo.svg.png", isActive: true, order: 5 },
  { name: "DUCKY", image: "https://upload.wikimedia.org/wikipedia/en/thumb/3/36/Ducky_logo.svg/1200px-Ducky_logo.svg.png", isActive: true, order: 6 },
  { name: "ZOWIE", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Zowie_logo.svg/1200px-Zowie_logo.svg.png", isActive: true, order: 7 },
  { name: "SENNHEISER", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Sennheiser_logo.svg/1200px-Sennheiser_logo.svg.png", isActive: true, order: 8 },
  { name: "HYPERX", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/HyperX_logo.svg/1200px-HyperX_logo.svg.png", isActive: true, order: 9 },
];

async function main() {
  await prisma.brandLogo.deleteMany(); // Clear existing
  await prisma.brandLogo.createMany({
    data: brands,
  });
  console.log("Seeded real image brands");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
