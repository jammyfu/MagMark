/**
 * MagMark 2.0 - Generate Preview Image from HTML
 * Uses Puppeteer/Playwright to capture screenshot
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎨 Generating MagMark 2.0 Preview Image...\n');

// Read the visual test HTML
const htmlPath = path.join(__dirname, 'visual-test.html');
const outputDir = path.join(__dirname, '..', 'generated-images');
const outputPath = path.join(outputDir, 'magmark-preview.png');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Check if puppeteer is available
try {
    const puppeteer = require('puppeteer');
    
    (async () => {
        console.log('Step 1: Launching headless browser...');
        
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        console.log('Step 2: Setting viewport for desktop view...');
        await page.setViewport({ width: 1200, height: 2400 });
        
        console.log('Step 3: Loading HTML file...');
        await page.goto(`file://${htmlPath}`, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        console.log('Step 4: Waiting for content to render...');
        await page.waitForSelector('.test-container', { timeout: 5000 });
        
        // Wait for CSS to fully load
        await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));
        
        console.log('Step 5: Taking full-page screenshot...');
        await page.screenshot({
            path: outputPath,
            fullPage: true,
            type: 'png'
        });
        
        await browser.close();
        
        // Verify file was created
        if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            console.log('\n✅ SUCCESS! Image generated:\n');
            console.log('   File:', outputPath);
            console.log('   Size:', (stats.size / 1024).toFixed(2) + ' KB');
            console.log('\nOpen it with: open ' + outputDir + '\n');
        } else {
            console.error('\n❌ Error: Screenshot not created');
        }
        
        process.exit(0);
    })();
    
} catch (error) {
    // Puppeteer not installed, provide manual instructions
    console.log('⚠️ Puppeteer not found. Please install manually:\n');
    console.log('   npm install --save-dev puppeteer\n');
    console.log('Or use this one-liner instead:\n');
    console.log('   # Open in browser and press Cmd+S to save as PNG');
    console.log('   open ' + htmlPath + '\n');
    
    // Fallback: Just copy the HTML file for user to open manually
    const fallbackOutput = path.join(outputDir, 'preview.html');
    fs.copyFileSync(htmlPath, fallbackOutput);
    console.log('\n📄 Fallback: Preview saved to ' + fallbackOutput);
    console.log('   Double-click it to open in browser!\n');
    
    process.exit(0);
}
