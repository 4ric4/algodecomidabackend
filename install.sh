#!/bin/bash

echo "?? Instalando Backend GastroLog..."
echo ""

# Verificar Node.js
echo "? Verificando Node.js..."
node --version || { echo "? Node.js não instalado!"; exit 1; }
echo ""

# Verificar npm
echo "? Verificando npm..."
npm --version || { echo "? npm não instalado!"; exit 1; }
echo ""

# Limpar cache
echo "?? Limpando cache npm..."
npm cache clean --force
echo ""

# Instalar dependências
echo "?? Instalando dependências..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "? Dependências instaladas com sucesso!"
    echo ""
    echo "?? Próximos passos:"
    echo "1. Configure o .env: cp .env.example .env"
    echo "2. Configure PostgreSQL e Redis"
    echo "3. Execute: npm run prisma:generate"
    echo "4. Execute: npm run prisma:migrate"
    echo "5. Inicie o servidor: npm run dev"
else
    echo ""
    echo "? Erro na instalação!"
    echo "Tente: npm install --legacy-peer-deps"
    exit 1
fi
