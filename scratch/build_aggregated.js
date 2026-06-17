const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// List of files that were updated in this task
const updatedFiles = [
  'app/(game)/daily-challenge.tsx',
  'app/(game)/levels.tsx',
  'app/(game)/play.tsx',
  'app/(game)/home.tsx',
  'app/_layout.tsx',
  'components/ArrowCell.tsx',
  'components/ArrowCellIcon.tsx',
  'components/GameGrid.tsx',
  'components/GameHeader.tsx',
  'components/WinOverlay.tsx',
  'constants/theme.ts',
  'engine/canEscape.ts',
  'engine/dailyChallengeGenerator.ts',
  'engine/escapeArrow.ts',
  'engine/generateLevel.ts',
  'engine/shapeMasks.ts',
  'engine/types.ts',
  'hooks/useDailyChallenge.ts',
  'hooks/useGameLogic.ts',
  'hooks/useSound.ts',
  'store/useGameStore.ts',
  'package.json',
  'tailwind.config.js',
  'app.json',
  '.gitignore',
];

const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ttf', '.mp3', '.wav', '.ico', '.pdf', '.zip', '.gz'];

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const relPath = path.relative(rootDir, filePath);

    // Skip ignored directories/files
    if (
      relPath.startsWith('node_modules') ||
      relPath.startsWith('.git') ||
      relPath.startsWith('.expo') ||
      relPath.startsWith('scratch') ||
      relPath.startsWith('dist') ||
      relPath === 'all_game_code.txt' ||
      relPath === 'updated_game_code.txt' ||
      relPath === 'crash_log.txt' ||
      relPath === 'package-lock.json'
    ) {
      continue;
    }

    const ext = path.extname(relPath).toLowerCase();
    if (binaryExtensions.includes(ext)) {
      continue;
    }

    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else {
      fileList.push(relPath);
    }
  }
  return fileList;
}

const allFiles = walk(rootDir);
allFiles.sort();

// Write all_game_code.txt
let allContent = '';
for (const file of allFiles) {
  const fullPath = path.join(rootDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  allContent += `==================================================\n`;
  allContent += `FILE: ${file}\n`;
  allContent += `==================================================\n\n`;
  allContent += content;
  allContent += `\n\n\n`;
}
fs.writeFileSync(path.join(rootDir, 'all_game_code.txt'), allContent, 'utf8');
console.log('all_game_code.txt written successfully.');

// Write updated_game_code.txt
let updatedContent = '';
for (const file of updatedFiles) {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    updatedContent += `===================================================================\n`;
    updatedContent += `FILE: ${file}\n`;
    updatedContent += `===================================================================\n`;
    updatedContent += content;
    updatedContent += `\n\n\n`;
  }
}
fs.writeFileSync(path.join(rootDir, 'updated_game_code.txt'), updatedContent, 'utf8');
console.log('updated_game_code.txt written successfully.');

// List of all files connected to the play screen
const playScreenFiles = [
  'app/(game)/play.tsx',
  'components/GameGrid.tsx',
  'components/ArrowCell.tsx',
  'components/ArrowCellIcon.tsx',
  'components/GameHeader.tsx',
  'components/HintButton.tsx',
  'components/WinOverlay.tsx',
  'components/GameOverOverlay.tsx',
  'store/useGameStore.ts',
  'store/useProgressStore.ts',
  'store/useSettingsStore.ts',
  'hooks/useSound.ts',
  'engine/types.ts',
  'engine/canEscape.ts',
  'engine/escapeArrow.ts',
  'engine/generateLevel.ts',
  'engine/shapeMasks.ts',
  'constants/config.ts',
  'constants/theme.ts',
];

// Write play_screen_code.txt
let playScreenContent = '';
for (const file of playScreenFiles) {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    playScreenContent += `===================================================================\n`;
    playScreenContent += `FILE: ${file}\n`;
    playScreenContent += `===================================================================\n`;
    playScreenContent += content;
    playScreenContent += `\n\n\n`;
  }
}
fs.writeFileSync(path.join(rootDir, 'play_screen_code.txt'), playScreenContent, 'utf8');
console.log('play_screen_code.txt written successfully.');

