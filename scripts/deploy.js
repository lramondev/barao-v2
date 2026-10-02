const { execSync } = require('child_process');

console.log('🚀 Iniciando deploy do Barão v2 no servidor remoto...\n');

try {
  // 1. Garante que os commits locais estão no GitHub
  console.log('1. Enviando alterações locais para o GitHub...');
  execSync('git push origin main', { stdio: 'inherit' });

  // 2. Executa pull e build no servidor remoto via script python
  console.log('\n2. Atualizando e compilando no servidor remoto...');
  const remoteCmd = 'cd /ws/node/barao-v2 && git pull origin main && npm run build';
  execSync(`py "C:\\Users\\rafae\\.gemini\\antigravity\\brain\\1e099e5d-51e2-424d-806d-b48b865586dc\\remote_exec.py" "${remoteCmd}"`, { stdio: 'inherit' });

  console.log('\n🎉 Deploy concluído com sucesso!');
  console.log('Acesse a nova versão em: https://barao.transoeste.com.br/v2/\n');
} catch (err) {
  console.error('\n❌ Erro durante o deploy:', err.message);
  process.exit(1);
}
