#!/usr/bin/env node

/**
 * GastroLog Admin Server
 * Web UI para visualizar e gerenciar o banco de dados PostgreSQL
 * Acesso: http://localhost:3002/admin
 */

const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============================================================================
// API Endpoints para obter dados das tabelas
// ============================================================================

// Listar todas as tabelas
app.get('/api/tables', async (req, res) => {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter dados de uma tabela específica
app.get('/api/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Validar nome da tabela para prevenir SQL injection
    const validTables = [
      'User', 'Restaurant', 'Review', 'Badge', 'Gamification', 'Notification'
    ];

    if (!validTables.includes(tableName)) {
      return res.status(400).json({ error: 'Tabela inválida' });
    }

    const model = prisma[tableName];
    if (!model) {
      return res.status(404).json({ error: 'Tabela não encontrada' });
    }

    const data = await model.findMany({
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { id: 'desc' }
    });

    const total = await model.count();

    res.json({
      data,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      tableName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter schema da tabela (estrutura das colunas)
app.get('/api/table/:tableName/schema', async (req, res) => {
  try {
    const { tableName } = req.params;

    const schema = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${tableName.toLowerCase()}
      ORDER BY ordinal_position
    `;

    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter estatísticas do banco
app.get('/api/stats', async (req, res) => {
  try {
    const stats = {
      users: await prisma.user.count(),
      restaurants: await prisma.restaurant.count(),
      reviews: await prisma.review.count(),
      badges: await prisma.badge.count(),
      notifications: await prisma.notification.count(),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Executar query customizada (CUIDADO: apenas para admin)
app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;

    // Apenas permitir SELECT para segurança
    if (!query.trim().toUpperCase().startsWith('SELECT')) {
      return res.status(403).json({ error: 'Apenas queries SELECT são permitidas' });
    }

    const result = await prisma.$queryRaw`${query}`;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar registro (com confirmação)
app.delete('/api/table/:tableName/:id', async (req, res) => {
  try {
    const { tableName, id } = req.params;

    const validTables = ['User', 'Restaurant', 'Review', 'Badge'];
    if (!validTables.includes(tableName)) {
      return res.status(400).json({ error: 'Operação não permitida' });
    }

    const model = prisma[tableName];
    await model.delete({ where: { id: parseInt(id) } });

    res.json({ success: true, message: 'Registro deletado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Servir HTML da interface admin
// ============================================================================

app.get('/admin', (req, res) => {
  res.send(getAdminHTML());
});

app.get('/', (req, res) => {
  res.redirect('/admin');
});

// ============================================================================
// Iniciar servidor
// ============================================================================

app.listen(PORT, () => {
  console.log(`
??????????????????????????????????????????????????????????????
?     ?? GastroLog Admin Dashboard                           ?
??????????????????????????????????????????????????????????????
?                                                            ?
?  ?? Acesso: http://localhost:${PORT}/admin                ?
?                                                            ?
?  ? Recursos:                                             ?
?     ? Visualizar todas as tabelas                         ?
?     ? Consultar dados com paginação                       ?
?     ? Ver estrutura do banco de dados                     ?
?     ? Executar queries customizadas                       ?
?     ? Deletar registros (com cuidado!)                    ?
?                                                            ?
??????????????????????????????????????????????????????????????
  `);
});

// ============================================================================
// HTML da interface
// ============================================================================

function getAdminHTML() {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GastroLog Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .glass-effect {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .table-scroll { max-height: 600px; overflow-y: auto; }
        .animated-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
    </style>
</head>
<body class="bg-gray-900 text-white">
    <div class="min-h-screen p-6">
        <!-- Header -->
        <div class="mb-8">
            <div class="animated-gradient p-8 rounded-lg shadow-lg">
                <h1 class="text-4xl font-bold mb-2">?? GastroLog Admin</h1>
                <p class="text-gray-200">Gerenciar banco de dados PostgreSQL em tempo real</p>
            </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8" id="stats-container">
            <div class="glass-effect p-4 rounded-lg text-center">
                <div class="text-3xl font-bold text-blue-400" id="stat-users">-</div>
                <div class="text-sm text-gray-300 mt-1">Usuários</div>
            </div>
            <div class="glass-effect p-4 rounded-lg text-center">
                <div class="text-3xl font-bold text-green-400" id="stat-restaurants">-</div>
                <div class="text-sm text-gray-300 mt-1">Restaurantes</div>
            </div>
            <div class="glass-effect p-4 rounded-lg text-center">
                <div class="text-3xl font-bold text-yellow-400" id="stat-reviews">-</div>
                <div class="text-sm text-gray-300 mt-1">Avaliações</div>
            </div>
            <div class="glass-effect p-4 rounded-lg text-center">
                <div class="text-3xl font-bold text-purple-400" id="stat-badges">-</div>
                <div class="text-sm text-gray-300 mt-1">Badges</div>
            </div>
            <div class="glass-effect p-4 rounded-lg text-center">
                <div class="text-3xl font-bold text-red-400" id="stat-notifications">-</div>
                <div class="text-sm text-gray-300 mt-1">Notificações</div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Sidebar - Tabelas -->
            <div class="glass-effect p-4 rounded-lg h-fit">
                <h2 class="text-xl font-bold mb-4">?? Tabelas</h2>
                <div id="tables-list" class="space-y-2">
                    <div class="text-gray-400 text-sm">Carregando...</div>
                </div>
            </div>

            <!-- Main - Dados -->
            <div class="lg:col-span-3 space-y-4">
                <!-- Controles -->
                <div class="glass-effect p-4 rounded-lg">
                    <div class="flex gap-2 items-center justify-between flex-wrap">
                        <div>
                            <label class="text-sm text-gray-300 mr-2">Registros por página:</label>
                            <select id="limit-select" class="bg-gray-800 text-white px-3 py-1 rounded text-sm">
                                <option value="10">10</option>
                                <option value="25" selected>25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                        <div class="flex gap-2">
                            <button id="refresh-btn" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm">?? Atualizar</button>
                            <button id="schema-btn" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm">?? Schema</button>
                        </div>
                    </div>
                </div>

                <!-- Tabela de Dados -->
                <div class="glass-effect p-4 rounded-lg">
                    <div id="data-container" class="table-scroll">
                        <div class="text-center text-gray-400 py-8">Selecione uma tabela para visualizar dados</div>
                    </div>
                </div>

                <!-- Paginação -->
                <div class="glass-effect p-4 rounded-lg flex justify-between items-center">
                    <button id="prev-btn" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm" disabled>? Anterior</button>
                    <span id="page-info" class="text-sm text-gray-300">Página 1</span>
                    <button id="next-btn" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm" disabled>Próxima ?</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentTable = null;
        let currentOffset = 0;
        let currentLimit = 25;
        let tableStats = {};

        // Carregar stats
        async function loadStats() {
            try {
                const response = await axios.get('/api/stats');
                document.getElementById('stat-users').textContent = response.data.users;
                document.getElementById('stat-restaurants').textContent = response.data.restaurants;
                document.getElementById('stat-reviews').textContent = response.data.reviews;
                document.getElementById('stat-badges').textContent = response.data.badges;
                document.getElementById('stat-notifications').textContent = response.data.notifications;
            } catch (error) {
                console.error('Erro ao carregar stats:', error);
            }
        }

        // Carregar lista de tabelas
        async function loadTables() {
            try {
                const response = await axios.get('/api/tables');
                const tablesList = document.getElementById('tables-list');
                tablesList.innerHTML = '';

                response.data.forEach(table => {
                    const button = document.createElement('button');
                    button.className = 'w-full text-left px-3 py-2 rounded hover:bg-gray-700 transition text-sm';
                    button.textContent = '?? ' + table.table_name;
                    button.onclick = () => selectTable(table.table_name);
                    tablesList.appendChild(button);
                });
            } catch (error) {
                console.error('Erro ao carregar tabelas:', error);
            }
        }

        // Selecionar tabela
        async function selectTable(tableName) {
            currentTable = tableName;
            currentOffset = 0;
            await loadTableData();

            // Highlight do botão selecionado
            document.querySelectorAll('#tables-list button').forEach(btn => {
                btn.classList.remove('bg-blue-600');
                if (btn.textContent.includes(tableName)) {
                    btn.classList.add('bg-blue-600');
                }
            });
        }

        // Carregar dados da tabela
        async function loadTableData() {
            if (!currentTable) return;

            try {
                const response = await axios.get(\`/api/table/\${currentTable}\`, {
                    params: { limit: currentLimit, offset: currentOffset }
                });

                displayTableData(response.data);
                updatePagination(response.data);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                document.getElementById('data-container').innerHTML = \`<div class="text-red-400 p-4">Erro: \${error.message}</div>\`;
            }
        }

        // Exibir dados da tabela
        function displayTableData(response) {
            const { data, tableName } = response;

            if (data.length === 0) {
                document.getElementById('data-container').innerHTML = '<div class="text-center text-gray-400 py-8">Nenhum registro encontrado</div>';
                return;
            }

            let html = \`
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-800 sticky top-0">
                            <tr>\`;

            const columns = Object.keys(data[0]);
            columns.forEach(col => {
                html += \`<th class="px-4 py-2 text-left text-xs font-semibold">\${col}</th>\`;
            });
            html += \`</tr>
                        </thead>
                        <tbody>\`;

            data.forEach(row => {
                html += '<tr class="border-b border-gray-700 hover:bg-gray-800 transition">';
                columns.forEach(col => {
                    let value = row[col];
                    if (value === null) value = '<span class="text-gray-500">NULL</span>';
                    else if (typeof value === 'boolean') value = \`<span class="text-blue-400">\${value}</span>\`;
                    else if (typeof value === 'object') value = '<code class="text-xs text-gray-400">' + JSON.stringify(value).substring(0, 50) + '</code>';
                    html += \`<td class="px-4 py-2 text-xs">\${value}</td>\`;
                });
                html += '</tr>';
            });

            html += '</tbody></table></div>';
            document.getElementById('data-container').innerHTML = html;
        }

        // Atualizar paginação
        function updatePagination(response) {
            const { total, limit, offset } = response;
            const currentPage = Math.floor(offset / limit) + 1;
            const totalPages = Math.ceil(total / limit);

            document.getElementById('page-info').textContent = \`Página \${currentPage} de \${totalPages} (Total: \${total} registros)\`;
            document.getElementById('prev-btn').disabled = offset === 0;
            document.getElementById('next-btn').disabled = offset + limit >= total;
        }

        // Event Listeners
        document.getElementById('refresh-btn').addEventListener('click', loadTableData);
        document.getElementById('schema-btn').addEventListener('click', async () => {
            if (!currentTable) return;
            try {
                const response = await axios.get(\`/api/table/\${currentTable}/schema\`);
                alert(JSON.stringify(response.data, null, 2));
            } catch (error) {
                alert('Erro: ' + error.message);
            }
        });

        document.getElementById('limit-select').addEventListener('change', (e) => {
            currentLimit = parseInt(e.target.value);
            currentOffset = 0;
            loadTableData();
        });

        document.getElementById('prev-btn').addEventListener('click', () => {
            currentOffset = Math.max(0, currentOffset - currentLimit);
            loadTableData();
        });

        document.getElementById('next-btn').addEventListener('click', () => {
            currentOffset += currentLimit;
            loadTableData();
        });

        // Inicializar
        loadStats();
        loadTables();
        setInterval(loadStats, 5000); // Atualizar stats a cada 5 segundos
    </script>
</body>
</html>
  `;
}

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
