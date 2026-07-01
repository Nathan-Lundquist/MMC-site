import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany({
    where: { username: null },
  });

  // Track used usernames to handle duplicates
  const existing = await prisma.employee.findMany({
    where: { username: { not: null } },
    select: { username: true },
  });
  const used = new Set(existing.map((e) => e.username!));

  for (const emp of employees) {
    // Generate username from first name, lowercase
    const firstName = emp.name.split(" ")[0].toLowerCase();
    let username = firstName;

    // Handle duplicates by appending last initial
    if (used.has(username)) {
      const parts = emp.name.split(" ");
      const lastInitial = parts[parts.length - 1][0].toLowerCase();
      username = `${firstName}.${lastInitial}`;
    }

    // If still duplicate, append number
    let counter = 2;
    const base = username;
    while (used.has(username)) {
      username = `${base}${counter}`;
      counter++;
    }

    used.add(username);
    await prisma.employee.update({
      where: { id: emp.id },
      data: { username },
    });
    console.log(`${emp.name} → ${username}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
