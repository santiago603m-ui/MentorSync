// aplicar-arquitectura.js
const fs = require('fs');
const path = require('path');

// Ajustar la ruta relativa según dónde ejecutes el script
const rootDir = fs.existsSync(path.join(__dirname, 'frontend')) 
    ? path.join(__dirname, 'frontend', 'src', 'app')
    : path.join(__dirname, 'src', 'app');

console.log(`🏗️ Aplicando arquitectura objetivo en: ${rootDir}`);

if (!fs.existsSync(rootDir)) {
    console.error(`❌ Error: No se encontró la carpeta src/app.`);
    process.exit(1);
}

function safeRemove(targetPath) {
    if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
        console.log(`🗑️ Eliminado: ${path.relative(rootDir, targetPath)}`);
    }
}

function safeMove(src, dest) {
    if (!fs.existsSync(src)) return;
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.renameSync(src, dest);
    console.log(`📁 Movido: ${path.relative(rootDir, src)} -> ${path.relative(rootDir, dest)}`);
}

// 1. Limpieza de residuos y carpetas temporales
safeRemove(path.join(rootDir, '_ARCHIVO_duplicados'));
safeRemove(path.join(rootDir, 'features', 'auth', 'loginPage.ts'));
safeRemove(path.join(rootDir, 'features', 'auth', 'registroPage.ts'));
safeRemove(path.join(rootDir, 'features', 'auth', 'components'));

// 2. Migrar src/app/pages/cursos hacia features/courses/pages/cursos-page/
const oldCursosDir = path.join(rootDir, 'pages', 'cursos');
const targetCursosDir = path.join(rootDir, 'features', 'courses', 'pages', 'cursos-page');

if (fs.existsSync(oldCursosDir)) {
    const files = fs.readdirSync(oldCursosDir);
    files.forEach(file => {
        safeMove(path.join(oldCursosDir, file), path.join(targetCursosDir, file));
    });
    safeRemove(path.join(rootDir, 'pages'));
}

// 3. Renombrar archivos camelCase a la convención estándar Angular (kebab-case)
safeMove(
    path.join(rootDir, 'features', 'admin-panel', 'adminPage.ts'),
    path.join(rootDir, 'features', 'admin-panel', 'admin-panel.component.ts')
);

safeMove(
    path.join(rootDir, 'features', 'mentor-dashboard', 'mentorPage.ts'),
    path.join(rootDir, 'features', 'mentor-dashboard', 'mentor-dashboard.component.ts')
);

// 4. Actualizar importaciones y rutas en todos los archivos
function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (let file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                getAllFiles(filePath, fileList);
            }
        } else {
            if (['.ts', '.html', '.css', '.scss'].some(ext => filePath.endsWith(ext))) {
                fileList.push(filePath);
            }
        }
    }
    return fileList;
}

const allFiles = getAllFiles(rootDir);

allFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Limpiar importaciones de archivos eliminados
    content = content.replace(/import\s+.*from\s+['"].*loginPage['"];?\r?\n?/g, '');
    content = content.replace(/import\s+.*from\s+['"].*registroPage['"];?\r?\n?/g, '');

    // Corregir rutas de Cursos
    content = content.replace(/pages\/cursos\/cursos-page\.component/g, 'features/courses/pages/cursos-page/cursos-page.component');
    content = content.replace(/pages\/cursos/g, 'features/courses/pages/cursos-page');

    // Corregir nombres de componentes admin y mentor
    content = content.replace(/adminPage/g, 'admin-panel.component');
    content = content.replace(/mentorPage/g, 'mentor-dashboard.component');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✨ Referencias actualizadas en: ${path.relative(rootDir, filePath)}`);
    }
});

console.log('\n✅ ¡Arquitectura frontend sincronizada exitosamente con 01_ARCHITECTURE.md!');