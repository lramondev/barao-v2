const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { 
  getVersionInfo, 
  applyVersionAndDate, 
  updateVersionAndDate, 
  rollbackVersion, 
  saveDeployInfo 
} = require('./update-version');

/**
 * Retorna o caminho correto de distribuição compilado pelo Angular 19
 */
function getDistPath() {
  const browserPath = path.resolve(__dirname, '..', 'dist', 'barao-v2', 'browser');
  if (fs.existsSync(browserPath)) {
    return browserPath;
  }
  return path.resolve(__dirname, '..', 'dist', 'barao-v2');
}

/**
 * Compila a aplicação Angular para o ambiente de produção
 */
function buildAngular() {
  console.log('Compilando a aplicação Angular para produção...');
  const buildResult = spawnSync('npx', ['ng', 'build', '--configuration', 'production'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      NG_PERSISTENT_BUILD_CACHE: '0',
      NODE_OPTIONS: '--max-old-space-size=4096'
    }
  });

  return buildResult.status === 0;
}

/**
 * Injeta a versão e a data/hora do build diretamente no index.html gerado
 */
function injectBuildInfo(distPath, versionInfo) {
  if (!versionInfo) return;
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.warn(`Aviso: index.html não encontrado em ${indexPath} para injeção de build info.`);
    return;
  }

  try {
    let indexHtml = fs.readFileSync(indexPath, 'utf8');
    const scriptTag = `<script id="barao-build-info">window.__APP_VERSION__="${versionInfo.newVersion}";window.__APP_UPDATED_AT__="${versionInfo.newDate}";</script>`;

    if (indexHtml.includes('id="barao-build-info"')) {
      indexHtml = indexHtml.replace(/<script id="barao-build-info">[\s\S]*?<\/script>/, scriptTag);
    } else if (indexHtml.includes('<head>')) {
      indexHtml = indexHtml.replace('<head>', `<head>${scriptTag}`);
    } else {
      indexHtml = scriptTag + indexHtml;
    }

    if (!indexHtml.includes('http-equiv="Cache-Control"')) {
      const metaTags = '<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"><meta http-equiv="Pragma" content="no-cache"><meta http-equiv="Expires" content="0">';
      if (indexHtml.includes('<head>')) {
        indexHtml = indexHtml.replace('<head>', `<head>${metaTags}`);
      }
    }

    fs.writeFileSync(indexPath, indexHtml, 'utf8');
    console.log(`Informações de build injetadas em index.html: v${versionInfo.newVersion} (${versionInfo.newDate})`);
  } catch (err) {
    console.warn('Aviso: Falha ao injetar build info em index.html:', err.message);
  }

  // Gera version.json para verificação periódica pelo navegador
  try {
    const versionJsonPath = path.join(distPath, 'version.json');
    const versionData = {
      version: versionInfo.newVersion,
      updated_at: versionInfo.newDate,
      timestamp: Date.now()
    };
    fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2) + '\n', 'utf8');
    console.log(`Arquivo version.json gerado em ${versionJsonPath}: v${versionInfo.newVersion} (${versionInfo.newDate})`);
  } catch (err) {
    console.warn('Aviso: Falha ao gerar version.json em dist:', err.message);
  }
}

/**
 * Envia os arquivos compilados do frontend para o servidor remoto/local via rsync
 */
function deployFrontend(targetHost) {
  const distPath = getDistPath();
  const remoteDest = `lrdev@${targetHost}:/ws/php/barao/public/v2/`;

  if (!fs.existsSync(distPath)) {
    console.error(`Erro: Diretório de distribuição não encontrado em ${distPath}`);
    return false;
  }

  console.log(`Enviando arquivos do frontend de ${distPath} para o servidor ${remoteDest}...`);

  const rsyncResult = spawnSync('rsync', ['-avz', './', remoteDest], {
    cwd: distPath,
    stdio: 'inherit',
    shell: true
  });

  return rsyncResult.status === 0;
}

module.exports = {
  getDistPath,
  getVersionInfo,
  applyVersionAndDate,
  updateVersionAndDate,
  rollbackVersion,
  saveDeployInfo,
  buildAngular,
  injectBuildInfo,
  deployFrontend
};
