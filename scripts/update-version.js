const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/**
 * Incrementa a versão semântica (patch: major.minor.patch -> major.minor.(patch + 1))
 */
function incrementVersion(version) {
  const cleanVersion = String(version || '0.1.0').replace(/^v/i, '').trim();
  const parts = cleanVersion.split('.');
  if (parts.length === 3) {
    const major = parseInt(parts[0], 10) || 0;
    const minor = parseInt(parts[1], 10) || 0;
    const patch = (parseInt(parts[2], 10) || 0) + 1;
    return `${major}.${minor}.${patch}`;
  } else if (parts.length === 2) {
    const major = parseInt(parts[0], 10) || 0;
    const minor = (parseInt(parts[1], 10) || 0) + 1;
    return `${major}.${minor}.0`;
  } else if (parts.length === 1) {
    const patch = (parseInt(parts[0], 10) || 0) + 1;
    return `0.1.${patch}`;
  }
  return '0.1.1';
}

/**
 * Retorna a data e hora atual no formato DD/MM/YYYY HH:mm
 */
function getFormattedDate(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Verifica se houve modificações reais no código
 */
function hasModifications(rootDir = path.resolve(__dirname, '..')) {
  const deployInfoPath = path.join(rootDir, '.deploy-info.json');

  const isIgnored = (filePath) => {
    const normalized = filePath.replace(/\\/g, '/');
    if (normalized.startsWith('dist/') || normalized === 'dist') return true;
    if (normalized === '.deploy-info.json' || normalized === 'scripts/.deploy-info.json') return true;
    if (normalized === 'package.json' || normalized === 'package-lock.json') return true;
    if (normalized.includes('version.json')) return true;
    return false;
  };

  try {
    // 1. Verificar alterações na árvore de trabalho (uncommitted / staged)
    const statusResult = spawnSync('git', ['status', '--porcelain'], {
      encoding: 'utf8',
      shell: true,
      cwd: rootDir
    });

    if (statusResult.status === 0 && statusResult.stdout) {
      const lines = statusResult.stdout.split('\n').map(l => l.trim()).filter(Boolean);
      const changes = lines.filter(line => {
        const parts = line.substring(3).trim().split(' -> ');
        const file = parts[parts.length - 1].trim();
        return !isIgnored(file);
      });

      if (changes.length > 0) {
        return {
          hasChanges: true,
          reason: `${changes.length} arquivo(s) modificado(s) na árvore de trabalho`
        };
      }
    }

    // 2. Verificar commits desde o último deploy registrado
    const headResult = spawnSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      shell: true,
      cwd: rootDir
    });
    const currentCommit = headResult.status === 0 ? headResult.stdout.trim() : null;

    if (fs.existsSync(deployInfoPath)) {
      try {
        const deployInfo = JSON.parse(fs.readFileSync(deployInfoPath, 'utf8'));
        if (deployInfo.lastCommit && currentCommit) {
          if (deployInfo.lastCommit !== currentCommit) {
            const diffResult = spawnSync('git', ['diff', '--name-only', deployInfo.lastCommit, currentCommit], {
              encoding: 'utf8',
              shell: true,
              cwd: rootDir
            });
            if (diffResult.status === 0 && diffResult.stdout) {
              const diffFiles = diffResult.stdout
                .split('\n')
                .map(l => l.trim())
                .filter(Boolean)
                .filter(f => !isIgnored(f));

              if (diffFiles.length > 0) {
                return {
                  hasChanges: true,
                  reason: `Novos commits detectados (${diffFiles.length} arquivo(s) alterados)`
                };
              }
            }
          }
          return {
            hasChanges: false,
            reason: 'Nenhuma alteração de código detectada desde o último deploy'
          };
        }
      } catch (e) {}
    }

    return {
      hasChanges: false,
      reason: 'Nenhuma alteração detectada'
    };
  } catch (err) {
    return {
      hasChanges: true,
      reason: 'Não foi possível verificar status via git (permitindo atualização)'
    };
  }
}

/**
 * Salva informações do deploy realizado
 */
function saveDeployInfo(versionInfo) {
  if (!versionInfo) return;
  const rootDir = path.resolve(__dirname, '..');
  const deployInfoPath = path.join(rootDir, '.deploy-info.json');
  try {
    const headResult = spawnSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      shell: true,
      cwd: rootDir
    });
    const currentCommit = headResult.status === 0 ? headResult.stdout.trim() : null;
    fs.writeFileSync(deployInfoPath, JSON.stringify({
      version: versionInfo.newVersion,
      date: versionInfo.newDate,
      lastCommit: currentCommit,
      deployedAt: new Date().toISOString()
    }, null, 2) + '\n', 'utf8');
  } catch (e) {
    console.warn('Aviso: Não foi possível salvar .deploy-info.json:', e.message);
  }
}

/**
 * Obtém as informações da versão atual e nova versão/data sem alterar nenhum arquivo em src/
 */
function getVersionInfo(options = {}) {
  const rootDir = path.resolve(__dirname, '..');
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageLockJsonPath = path.join(rootDir, 'package-lock.json');

  // 1. Ler versão atual do package.json
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = pkg.version || '0.1.0';
  let currentDate = getFormattedDate();

  // 2. Verificar se há modificações
  const force = options.force || process.argv.includes('--force');
  const modCheck = force
    ? { hasChanges: true, reason: 'Atualização forçada (--force)' }
    : hasModifications(rootDir);

  if (!modCheck.hasChanges) {
    console.log('\n======================================================');
    console.log('Verificação de versão e data/hora do sistema:');
    console.log(`  Status:  ${modCheck.reason}`);
    console.log(`  Versão:  v${currentVersion} (mantida)`);
    console.log(`  Data:    ${currentDate} (mantida)`);
    console.log('======================================================\n');

    return {
      changed: false,
      oldVersion: currentVersion,
      newVersion: currentVersion,
      oldDate: currentDate,
      newDate: currentDate,
      packageJsonPath,
      packageLockJsonPath
    };
  }

  const oldVersion = currentVersion;
  const newVersion = incrementVersion(oldVersion);
  const oldDate = currentDate;
  const newDate = getFormattedDate();

  console.log('\n======================================================');
  console.log('Modificações detectadas! Preparando versão e data/hora:');
  console.log(`  Motivo:  ${modCheck.reason}`);
  console.log(`  Versão:  v${oldVersion} -> v${newVersion}`);
  console.log(`  Data:    ${oldDate} -> ${newDate}`);
  console.log('======================================================\n');

  let oldPkgLockVersion = oldVersion;
  if (fs.existsSync(packageLockJsonPath)) {
    try {
      const pkgLock = JSON.parse(fs.readFileSync(packageLockJsonPath, 'utf8'));
      oldPkgLockVersion = pkgLock.version || oldVersion;
    } catch (e) {}
  }

  return {
    changed: true,
    oldVersion,
    newVersion,
    oldDate,
    newDate,
    oldPkgLockVersion,
    packageJsonPath,
    packageLockJsonPath
  };
}

/**
 * Aplica as alterações de versão e data/hora nos arquivos de repositório.
 */
function applyVersionAndDate(info) {
  if (!info || !info.changed) return;

  const { newVersion, newDate, packageJsonPath, packageLockJsonPath } = info;

  // 1. Atualizar package.json
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    pkg.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }

  // 2. Atualizar package-lock.json se existir
  if (fs.existsSync(packageLockJsonPath)) {
    try {
      const pkgLock = JSON.parse(fs.readFileSync(packageLockJsonPath, 'utf8'));
      pkgLock.version = newVersion;
      if (pkgLock.packages && pkgLock.packages['']) {
        pkgLock.packages[''].version = newVersion;
      }
      fs.writeFileSync(packageLockJsonPath, JSON.stringify(pkgLock, null, 2) + '\n', 'utf8');
    } catch (e) {
      console.warn('Aviso: Não foi possível atualizar package-lock.json:', e.message);
    }
  }

  // 3. Atualizar src/version.json
  const rootDir = path.resolve(__dirname, '..');
  const srcVersionPath = path.join(rootDir, 'src', 'version.json');
  try {
    fs.writeFileSync(srcVersionPath, JSON.stringify({
      version: newVersion,
      updated_at: newDate,
      timestamp: Date.now()
    }, null, 2) + '\n', 'utf8');
  } catch (e) {
    console.warn('Aviso: Não foi possível atualizar src/version.json:', e.message);
  }

  // 4. Atualizar src/environments/environment.ts e environment.prod.ts
  const envFiles = [
    path.join(rootDir, 'src', 'environments', 'environment.ts'),
    path.join(rootDir, 'src', 'environments', 'environment.prod.ts')
  ];

  envFiles.forEach((envPath) => {
    if (fs.existsSync(envPath)) {
      try {
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(
          /(version\s*:\s*(?:win\.__APP_VERSION__\s*\|\|\s*)?['"`])([^'"`]+)(['"`])/,
          `$1${newVersion}$3`
        );
        envContent = envContent.replace(
          /(updated_at\s*:\s*(?:win\.__APP_UPDATED_AT__\s*\|\|\s*)?['"`])([^'"`]+)(['"`])/,
          `$1${newDate}$3`
        );
        fs.writeFileSync(envPath, envContent, 'utf8');
      } catch (e) {
        console.warn(`Aviso: Não foi possível atualizar ${envPath}:`, e.message);
      }
    }
  });
}

/**
 * Atualiza imediatamente a versão e a data/hora
 */
function updateVersionAndDate(options = {}) {
  const info = getVersionInfo(options);
  if (info.changed) {
    applyVersionAndDate(info);
  }
  return info;
}

/**
 * Reverte a versão e data/hora caso o build falhe
 */
function rollbackVersion(info) {
  if (!info || !info.changed) return;
  console.log(`Revertendo versão para v${info.oldVersion} e data para ${info.oldDate}...`);

  if (fs.existsSync(info.packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(info.packageJsonPath, 'utf8'));
    pkg.version = info.oldVersion;
    fs.writeFileSync(info.packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }

  if (fs.existsSync(info.packageLockJsonPath)) {
    try {
      const pkgLock = JSON.parse(fs.readFileSync(info.packageLockJsonPath, 'utf8'));
      pkgLock.version = info.oldPkgLockVersion || info.oldVersion;
      if (pkgLock.packages && pkgLock.packages['']) {
        pkgLock.packages[''].version = info.oldPkgLockVersion || info.oldVersion;
      }
      fs.writeFileSync(info.packageLockJsonPath, JSON.stringify(pkgLock, null, 2) + '\n', 'utf8');
    } catch (e) {}
  }
}

if (require.main === module) {
  const result = updateVersionAndDate();
  if (result.changed) {
    saveDeployInfo(result);
  }
}

module.exports = {
  incrementVersion,
  getFormattedDate,
  hasModifications,
  saveDeployInfo,
  getVersionInfo,
  applyVersionAndDate,
  updateVersionAndDate,
  rollbackVersion
};
