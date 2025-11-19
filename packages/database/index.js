const { PrismaClient } = require('@prisma/client');

// Singleton pattern para o Prisma Client
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  // Em desenvolvimento, usar global para evitar múltiplas instâncias
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

module.exports = { prisma, PrismaClient };
