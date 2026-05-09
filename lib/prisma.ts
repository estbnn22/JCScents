import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

import { PrismaClient, type Prisma } from "../app/generated/prisma/client";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  if (connectionString.startsWith("prisma+postgres://")) {
    return new PrismaClient({
      accelerateUrl: connectionString,
    }).$extends(withAccelerate());
  }

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
    }),
  });
}

type PrismaInstance = ReturnType<typeof createPrismaClient>;
export type PrismaTransactionClient = Prisma.TransactionClient;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaInstance | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
