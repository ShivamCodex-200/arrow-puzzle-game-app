const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\praja\\apps\\arrowpuzzle-game';
const outputFile = path.join(rootDir, 'all_game_code.txt');

const ignoreDirs = new Set([
  'node_modules', '.git', '.expo', '.expo-shared', 'scratch',
  'web-build', 'dist', '.github', 'assets'
]);

const ignoreFiles = new Set([
  'all_game_code.txt', 'updated_game_code.txt', 'package-lock.json',
  '.gitignore', 'yarn.lock'
]);

const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.md', '.html']);

let result = '';

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(rootDir, fullPath);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (ignoreDirs.has(file)) continue;
      walk(fullPath);
    } else {
      if (ignoreFiles.has(file)) continue;
      const ext = path.extname(file).toLowerCase();
      if (!allowedExtensions.has(ext)) continue;
      console.log('Processing: ' + relPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      result += '\n==================================================\n';
      result += 'FILE: ' + relPath + '\n';
      result += '==================================================\n\n';
      result += content + '\n\n';
    }
  }
}

walk(rootDir);
fs.writeFileSync(outputFile, result.trim() + '\n', 'utf8');
console.log('\nDone! all_game_code.txt rebuilt successfully.');
