const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');
const version = packageJson.version;

const rootDir = path.resolve(__dirname, '..');

function syncMarkdown(filePath) {
    const fullPath = path.join(rootDir, filePath);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Update version badges: version-X.Y.Z-gold.svg or similar
    content = content.replace(/version-[\d\.]+-gold\.svg/g, `version-${version}-gold.svg`);
    
    // Update hardcoded versions in headers or text (be careful with this one)
    // Looking for "MagMark X.Y.Z"
    content = content.replace(/MagMark \d\.\d\.\d/g, `MagMark ${version}`);
    
    fs.writeFileSync(fullPath, content);
    console.log(`Synced version to ${filePath}`);
}

// Files to sync
const filesToSync = [
    'README.md',
    'QUICK_START.md',
    'REFACTOR_PLAN.md',
    'TESTING_GUIDE.md'
];

filesToSync.forEach(syncMarkdown);

console.log(`Successfully synced version ${version} to all static files.`);
