const { 
  getDistPath,
  getVersionInfo, 
  applyVersionAndDate, 
  buildAngular, 
  injectBuildInfo, 
  deployFrontend, 
  saveDeployInfo 
} = require('./deploy-helper');
const path = require('path');

const isLocal = process.argv.includes('local') || process.argv.includes('--local');
const targetHost = isLocal ? '192.168.1.240' : 'remoto.transoeste.com.br';

console.log(`Modo de implantação do Frontend Barão v2: ${isLocal ? 'LOCAL (192.168.1.240)' : 'REMOTO (remoto.transoeste.com.br)'}`);

// 1. Obtém a versão e data/hora
const versionInfo = getVersionInfo();

// 2. Executa o build da aplicação Angular para produção
const buildSuccess = buildAngular();
if (!buildSuccess) {
  console.error('\nErro: A compilação do Angular falhou.');
  process.exit(1);
}

console.log('\nCompilação concluída com sucesso!');

// 3. Injeta a versão e data/hora diretamente no index.html gerado
const distPath = getDistPath();
injectBuildInfo(distPath, versionInfo);

// 4. Envia os arquivos para o servidor via rsync
const deploySuccess = deployFrontend(targetHost);
if (!deploySuccess) {
  console.error('\nErro: Falha no envio dos arquivos do frontend via rsync.');
  process.exit(1);
}

// 5. Salva o registro da versão/deploy
saveDeployInfo(versionInfo);

// 6. Atualiza package.json e package-lock.json após o término do build e envio
if (versionInfo.changed) {
  applyVersionAndDate(versionInfo);
}

if (versionInfo.changed) {
  console.log(`\nImplantação concluída com sucesso! Versão v${versionInfo.newVersion} (${versionInfo.newDate}) gerada e publicada.`);
} else {
  console.log(`\nImplantação concluída com sucesso! Nenhuma modificação no código; versão v${versionInfo.newVersion} (${versionInfo.newDate}) mantida.`);
}
console.log(`\nDestino publicado: lrdev@${targetHost}:/ws/php/barao/public/v2/`);
console.log(`URL de Acesso: https://${isLocal ? '192.168.1.240' : 'barao.transoeste.com.br'}/v2/\n`);
