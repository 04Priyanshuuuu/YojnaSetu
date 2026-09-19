const { execSync } = require('child_process');
const path = require('path');

const frontendDir = path.resolve(__dirname, '..', 'yojna setu', '01frontend');
console.log(`[build-frontend] Building frontend in: ${frontendDir}`);

console.log('[build-frontend] Running npm install in frontend directory...');
execSync('npm install', {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true,
});

console.log('[build-frontend] Running npm run build in frontend directory...');
execSync('npm run build', {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true,
});

console.log('[build-frontend] Frontend build complete!');
