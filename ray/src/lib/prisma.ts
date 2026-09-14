import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function resolveDatabaseUrl(): string {
   const configuredUrl = process.env.DATABASE_URL?.trim();

  if (!configuredUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Please set DATABASE_URL before starting the application."
    );
  }

  let url = configuredUrl;

  // Replace @localhost: with @127.0.0.1: to avoid IPv6 [::1] connection timeout on Linux
  url = url.replace("@localhost:", "@127.0.0.1:");

  // Guarantee allowPublicKeyRetrieval=true so MySQL 8.0 caching_sha2_password RSA handshake never hangs
  if (!url.includes("allowPublicKeyRetrieval")) {
    url += (url.includes("?") ? "&" : "?") + "allowPublicKeyRetrieval=true";
  }

  return url;
}

const prismaClientSingleton = () => {
  const dbUrl = resolveDatabaseUrl();
  const adapter = new PrismaMariaDb(dbUrl);
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: ReturnType<typeof prismaClientSingleton> | undefined;
}

// Lazy-loading proxy to prevent build-time crashes in Next.js and guarantee persistent connection pool
const prisma = new Proxy({} as ReturnType<typeof prismaClientSingleton>, {
  get: (target, prop) => {
    if (!globalThis.prisma || (typeof prop === "string" && !(prop in globalThis.prisma) && prop.startsWith("ray"))) {
      globalThis.prisma = prismaClientSingleton();
    }
    return (globalThis.prisma as any)[prop];
  },
});

export default prisma;
