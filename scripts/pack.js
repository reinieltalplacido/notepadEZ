import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import child_process from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const zipPath = 'C:\\Users\\reini\\AppData\\Local\\electron\\Cache\\4e3de70a5ed55340feb8af0ab617a316a0224b9a0031f4c810ffb1ea89460f31\\electron-v31.0.0-win32-x64.zip';
const outputDir = path.join(rootDir, 'release', 'win-unpacked');
const appDir = path.join(outputDir, 'resources', 'app');

console.log('📦 Cleaning output directory...');
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });

console.log('⚡ Extracting Electron binary binaries...');
const psCommand = `Expand-Archive -Path "${zipPath}" -DestinationPath "${outputDir}" -Force`;
child_process.execSync(`powershell -Command "${psCommand}"`, { stdio: 'inherit' });

console.log('📁 Copying app resources...');
fs.mkdirSync(appDir, { recursive: true });

// Copy dist directory
fs.cpSync(path.join(rootDir, 'dist'), path.join(appDir, 'dist'), { recursive: true });

// Copy electron directory
fs.cpSync(path.join(rootDir, 'electron'), path.join(appDir, 'electron'), { recursive: true });

// Copy package.json
fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(appDir, 'package.json'));

// Rename electron.exe to Notepad.exe
const defaultExe = path.join(outputDir, 'electron.exe');
const targetExe = path.join(outputDir, 'Notepad.exe');
if (fs.existsSync(defaultExe)) {
  fs.renameSync(defaultExe, targetExe);
}

console.log('✅ Desktop App unpacked build successful!');
console.log(`🚀 Executable Location: ${targetExe}`);
