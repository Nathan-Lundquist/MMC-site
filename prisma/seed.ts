import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.employee.upsert({
    where: { email: "admin@mikescleancut.com" },
    update: { username: "admin" },
    create: {
      email: "admin@mikescleancut.com",
      username: "admin",
      name: "Mike Admin",
      role: "ADMIN",
      passwordHash,
    },
  });
  console.log("Created admin:", admin.username);

  const foremanHash = await bcrypt.hash("foreman123", 12);
  const foreman = await prisma.employee.upsert({
    where: { email: "foreman@mikescleancut.com" },
    update: { username: "dave" },
    create: {
      email: "foreman@mikescleancut.com",
      username: "dave",
      name: "Dave Foreman",
      role: "FOREMAN",
      passwordHash: foremanHash,
    },
  });
  console.log("Created foreman:", foreman.username);

  const customer = await prisma.customer.upsert({
    where: { id: "sample-customer-1" },
    update: {},
    create: {
      id: "sample-customer-1",
      name: "Johnson Residence",
      phone: "(248) 555-0100",
      email: "johnson@example.com",
      address: "123 Oak Lane",
      city: "Rochester Hills",
      state: "MI",
      zip: "48307",
    },
  });
  console.log("Created customer:", customer.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
