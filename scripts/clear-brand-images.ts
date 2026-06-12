import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.brandLogo.updateMany({
    data: {
      image: ""
    }
  });
  console.log("Cleared brand images");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
