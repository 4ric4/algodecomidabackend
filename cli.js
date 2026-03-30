#!/usr/bin/env node

/**
 * GastroLog CLI - Ferramenta para gerenciar o banco de dados
 * Uso: node cli.js [comando] [opções]
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

// ============================================================================
// Cores para terminal
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// ============================================================================
// Funções auxiliares
// ============================================================================

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function table(data) {
  console.table(data);
}

// ============================================================================
// Comandos
// ============================================================================

const commands = {
  // Listar todas as tabelas
  async 'tables'() {
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      log(colors.cyan, '?? Tabelas disponíveis:');
      tables.forEach(t => log(colors.green, '  ?', t.table_name));
    } catch (error) {
      log(colors.red, '? Erro:', error.message);
    }
  },

  // Ver estatísticas
  async 'stats'() {
    try {
      const stats = {
        users: await prisma.user.count(),
        restaurants: await prisma.restaurant.count(),
        reviews: await prisma.review.count(),
        badges: await prisma.badge.count(),
        gamifications: await prisma.gamification.count(),
        notifications: await prisma.notification.count(),
      };
      log(colors.cyan, '?? Estatísticas do banco:');
      table(stats);
    } catch (error) {
      log(colors.red, '? Erro:', error.message);
    }
  },

  // Listar usuários
  async 'users'(limit = 10) {
    try {
      const users = await prisma.user.findMany({
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          level: true,
          xp: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
      });
      log(colors.cyan, `?? Últimos ${limit} usuários:`);
      table(users);
    } catch (error) {
      log(colors.red, '? Erro:', error.message);
    }
  },

  // Listar restaurantes
  async 'restaurants'(limit = 10) {
    try {
      const restaurants = await prisma.restaurant.findMany({
        take: parseInt(limit),
        select: {
          id: true,
          name: true,
          city: true,
          rating: true,
          reviewsCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
      });
      log(colors.cyan, `???  Últimos ${limit} restaurantes:`);
      table(restaurants);
    } catch (error) {
      log(colors.red, '? Erro:', error.message);
    }
  },

  // Listar avaliações
  async 'reviews'(limit = 10) {
    try {
      const reviews = await prisma.review.findMany({
        take: parseInt(limit),
        include: {
          user: { select: { username: true } },
          restaurant: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      log(colors.cyan, `? Últimas ${limit} avaliações:`);
      reviews.forEach(review => {
        log(colors.yellow, `
  ID: ${review.id}
  Usuário: ${review.user.username}
  Restaurante: ${review.restaurant.name}
  Rating: ${review.rating}/5
  Data: ${new Date(review.createdAt).toLocaleString()}
  ---`);
      });
    } catch (error) {
      log(colors.red, '? Erro:', error.message);
    }
  },

  // Listar badges
  async 'badges'() {
    try {
      const badges = await prisma.badge.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
        }
      });
      log(colors.cyan, '?? Badges disponíveis:');
      table(badges);
    } catch (error) {
      log(colors.red, '? Erro:', error.message);
    }
  },

  // Procurar usuário por email
  async 'find-user'(email) {
    if (!email) {
      log(colors.red, '? Email é obrigatório');
      return;
    }
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          reviews: { select: { id: true, rating: true, text: true } }
        }
      });
      if (!user) {
        log(colors.yellow, '??  Usuário não encontrado');
      } else {
        log(colors.cyan, '?? Usuário encontrado:');
        table({
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          level: user.level,
          xp: user.xp,
          followers: user.followers,
          following: user.following,
          reviewsCount: user.reviewsCount,
          createdAt: user.createdAt,
        });
        if (user.reviews.length > 0) {
          log(colors.magenta, '\nAvaliações:');
          table(user.reviews);
        }
      }
    } catch (error) {
      log(colors.red, '? Erro:', error.message);
    }
  },

  // Procurar restaurante por nome
  async 'find-restaurant'(name) {
    if (!name) {
      log(colors.red, '? Nome é obrigatório');
      return;
    }
    try {
      const restaurant = await prisma.restaurant.findMany({
        where: {
          name: { contains: name, mode: 'insensitive' }
        },
        take: 10,
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          rating: true,
          reviewsCount: true,
        }
      });
      if (restaurant.length === 0) {
        log(colors.yellow, '??  Nenhum restaurante encontrado');
      } else {
        log(colors.cyan, `???  ${restaurant.length} restaurante(s) encontrado(s):`);
        table(restaurant);
      }
    } catch (error) {
      log(colors.red, '? Erro:', error.message);
    }
  },

  // Limpar dados (cuidado!)
  async 'clear-data'(table) {
    if (!table) {
      log(colors.red, '? Nome da tabela é obrigatório');
      return;
    }

    const validTables = ['Review', 'Gamification', 'Notification'];
    if (!validTables.includes(table)) {
      log(colors.red, '? Tabela não permitida para limpeza (por segurança)');
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`??  Tem certeza que deseja limpar a tabela ${table}? (sim/não): `, async (answer) => {
      rl.close();
      
      if (answer.toLowerCase() === 'sim') {
        try {
          const model = prisma[table];
          const result = await model.deleteMany({});
          log(colors.green, `? ${result.count} registros deletados`);
        } catch (error) {
          log(colors.red, '? Erro:', error.message);
        }
      } else {
        log(colors.yellow, '? Operação cancelada');
      }
      process.exit(0);
    });
  },

  // Ajuda
  'help'() {
    log(colors.cyan, `
??????????????????????????????????????????????????????????????
?          GastroLog CLI - Comandos Disponíveis              ?
??????????????????????????????????????????????????????????????

?? LISTAR:
  node cli.js tables              - Listar todas as tabelas
  node cli.js stats               - Ver estatísticas
  node cli.js users [limit]       - Listar usuários (padrão: 10)
  node cli.js restaurants [limit] - Listar restaurantes (padrão: 10)
  node cli.js reviews [limit]     - Listar avaliações (padrão: 10)
  node cli.js badges              - Listar badges

?? PROCURAR:
  node cli.js find-user EMAIL              - Procurar usuário
  node cli.js find-restaurant NOME         - Procurar restaurante

???  LIMPAR (CUIDADO!):
  node cli.js clear-data TABELA   - Limpar dados da tabela

??  OUTROS:
  node cli.js help                - Mostrar este menu

?? EXEMPLO:
  node cli.js users 50            - Listar 50 últimos usuários
  node cli.js find-user user@example.com - Procurar usuário
    `);
  }
};

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const params = args.slice(1);

  if (command in commands) {
    await commands[command](...params);
  } else {
    log(colors.red, `? Comando desconhecido: ${command}`);
    log(colors.cyan, 'Use "node cli.js help" para ver os comandos disponíveis');
  }

  await prisma.$disconnect();
}

main().catch(error => {
  log(colors.red, '? Erro:', error.message);
  process.exit(1);
});
