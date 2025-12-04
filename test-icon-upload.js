const path = require('path');
const fs = require('fs');

// Simular o caminho usado pela rota
const uploadDir = path.join(__dirname, 'uploads', 'icones');

console.log('=== TESTE DE CONFIGURAÇÃO DE ÍCONES ===\n');
console.log('1. Caminho do diretório de upload:');
console.log('   ' + uploadDir);
console.log('');

console.log('2. Diretório existe?');
if (fs.existsSync(uploadDir)) {
  console.log('   ✓ Sim');
  console.log('');
  
  console.log('3. Arquivos no diretório:');
  const files = fs.readdirSync(uploadDir);
  if (files.length === 0) {
    console.log('   (vazio)');
  } else {
    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   - ${file} (${sizeKB} KB)`);
    });
  }
} else {
  console.log('   ✗ Não - Criando...');
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('   ✓ Diretório criado com sucesso');
}

console.log('');
console.log('4. URL de acesso (quando servidor estiver rodando):');
console.log('   http://localhost:3001/uploads/icones/[nome-do-arquivo]');
console.log('');

console.log('=== TESTE CONCLUÍDO ===');
