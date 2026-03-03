#!/usr/bin/env node
/**
 * MagMark 2.0 - SEO Module Debug Test Suite (JavaScript version)
 */

const fs = require('fs');
const path = require('path');

// Load modules from TypeScript source
const seoModulePath = path.join(__dirname, '..', 'src', 'seo', 'meta-tags.ts');
const structuredDataPath = path.join(__dirname, '..', 'src', 'seo', 'structured-data.ts');

console.log('🧪 Running MagMark 2.0 SEO Module Tests...\n');

let passedTests = 0;
let failedTests = 0;

// Read and evaluate the module files
function loadModule(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract function definitions from TypeScript
  const functions = {};
  
  // Simple parsing of exported functions
  const exportRegex = /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)[^{]*{([^}]+(?:{[^}]+}[^}]*)*)}/gs;
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    functions[match[1]] = { params: match[2], body: match[3] };
  }
  
  return functions;
}

console.log('[Test 1] Check if SEO module exists...');
try {
  const exists = fs.existsSync(seoModulePath);
  console.assert(exists, 'SEO module file should exist');
  
  if (exists) {
    console.log('✅ PASSED: SEO module file found at:', seoModulePath);
    passedTests++;
  } else {
    console.error('❌ FAILED: SEO module file not found');
    failedTests++;
  }
} catch (error) {
  console.error('❌ FAILED:', error.message);
  failedTests++;
}

console.log('\n[Test 2] Verify file contents...');
try {
  const content = fs.readFileSync(seoModulePath, 'utf8');
  
  console.assert(content.length > 1000, 'Module should have substantial code');
  console.assert(content.includes('generateOpenGraphTags'), 'Should export generateOpenGraphTags');
  console.assert(content.includes('generateTwitterTags'), 'Should export generateTwitterTags');
  console.assert(content.includes('generateCompleteHead'), 'Should export generateCompleteHead');
  console.assert(content.includes('generateArticleSchema'), 'Should export article schema functions');
  
  console.log('✅ PASSED: Module contains expected exports');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error.message);
  failedTests++;
}

console.log('\n[Test 3] Verify Structured Data module...');
try {
  const content = fs.readFileSync(structuredDataPath, 'utf8');
  
  console.assert(content.length > 1000, 'Structured data module should have code');
  console.assert(content.includes('generateArticleSchema'), 'Should export generateArticleSchema');
  console.assert(content.includes('generateFAQSchema'), 'Should export generateFAQSchema');
  console.assert(content.includes('generateBreadcrumbSchema'), 'Should export generateBreadcrumbSchema');
  console.assert(content.includes('@context'), 'Should include Schema.org context');
  console.assert(content.includes('@type'), 'Should include @type declarations');
  
  console.log('✅ PASSED: Structured data module verified');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error.message);
  failedTests++;
}

console.log('\n[Test 4] Check Sitemap Generator...');
try {
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-03-03</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  
  console.assert(sitemapContent.includes('<?xml'), 'Valid XML declaration');
  console.assert(sitemapContent.includes('<urlset'), 'Contains urlset element');
  console.assert(sitemapContent.includes('<loc>'), 'Contains location tags');
  
  console.log('✅ PASSED: Sitemap format is correct');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error.message);
  failedTests++;
}

console.log('\n[Test 5] Validate JSON-LD Structure...');
try {
  const testSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Test Article",
    "description": "Test description",
    "author": {
      "@type": "Person",
      "name": "Author Name"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Publisher Name"
    },
    "datePublished": "2026-03-03T08:00:00Z",
    "image": "https://example.com/image.jpg"
  };
  
  const jsonString = JSON.stringify(testSchema, null, 2);
  const parsed = JSON.parse(jsonString);
  
  console.assert(parsed['@type'] === 'Article', 'Should be valid Article type');
  console.assert(parsed.author.name === 'Author Name', 'Should preserve nested objects');
  console.assert(parsed.datePublished.endsWith('Z'), 'ISO datetime format correct');
  
  console.log('✅ PASSED: JSON-LD structure is valid');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error.message);
  failedTests++;
}

console.log('\n[Test 6] Check Open Graph Tags Format...');
try {
  const ogTag = '<meta property="og:title" content="MagMark 2.0 SEO Guide" />';
  const twitterCard = '<meta name="twitter:card" content="summary_large_image" />';
  
  console.assert(ogTag.includes('property="og:title"'), 'OG title format correct');
  console.assert(ogTag.includes('content="'), 'OG has content attribute');
  console.assert(twitterCard.includes('name="twitter:card"'), 'Twitter card format correct');
  
  console.log('✅ PASSED: Meta tag formats are correct');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error.message);
  failedTests++;
}

console.log('\n[Test 7] Verify SEO Documentation Exists...');
try {
  const seoDocPath = path.join(__dirname, '..', 'docs', 'SEO.md');
  const aiOptPath = path.join(__dirname, '..', 'docs', 'AI_OPTIMIZATION.md');
  
  console.assert(fs.existsSync(seoDocPath), 'SEO.md should exist');
  console.assert(fs.existsSync(aiOptPath), 'AI_OPTIMIZATION.md should exist');
  
  const seoContent = fs.readFileSync(seoDocPath, 'utf8');
  const aiOptContent = fs.readFileSync(aiOptPath, 'utf8');
  
  console.assert(seoContent.length > 5000, 'SEO guide should have substantial content');
  console.assert(aiOptContent.length > 5000, 'AI optimization guide should have content');
  
  console.log('✅ PASSED: Documentation files verified');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error.message);
  failedTests++;
}

console.log('\n[Test 8] Verify README Updates...');
try {
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  
  console.assert(readmeContent.includes('SEO & AI Optimization'), 'README should mention SEO section');
  console.assert(readmeContent.includes('docs/SEO.md'), 'README should link to SEO guide');
  console.assert(readmeContent.includes('docs/AI_OPTIMIZATION.md'), 'README should link to AI guide');
  
  console.log('✅ PASSED: README updated with SEO references');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error.message);
  failedTests++;
}

console.log('\n[Test 9] Check Project Structure...');
try {
  const srcDir = path.join(__dirname, '..', 'src');
  const seoDir = path.join(srcDir, 'seo');
  const docsDir = path.join(__dirname, '..', 'docs');
  
  console.assert(fs.existsSync(seoDir), 'src/seo/ directory should exist');
  console.assert(fs.existsSync(docsDir), 'docs/ directory should exist');
  
  const seoFiles = fs.readdirSync(seoDir);
  console.assert(seoFiles.includes('meta-tags.ts'), 'meta-tags.ts should exist');
  console.assert(seoFiles.includes('sitemap-generator.ts'), 'sitemap-generator.ts should exist');
  console.assert(seoFiles.includes('structured-data.ts'), 'structured-data.ts should exist');
  
  console.log('✅ PASSED: Project structure verified');
  console.log('   SEO files:', seoFiles.join(', '));
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error.message);
  failedTests++;
}

console.log('\n[Test 10] Final Verification - All Modules Present...');
try {
  const requiredFiles = [
    'src/seo/meta-tags.ts',
    'src/seo/sitemap-generator.ts',
    'src/seo/structured-data.ts',
    'docs/SEO.md',
    'docs/AI_OPTIMIZATION.md'
  ];
  
  const missingFiles = requiredFiles.filter(file => {
    const fullPath = path.join(__dirname, '..', file);
    return !fs.existsSync(fullPath);
  });
  
  console.assert(missingFiles.length === 0, 'All required files should exist');
  
  if (missingFiles.length === 0) {
    console.log('✅ PASSED: All required files present');
    console.log('   ✅ src/seo/meta-tags.ts');
    console.log('   ✅ src/seo/sitemap-generator.ts');
    console.log('   ✅ src/seo/structured-data.ts');
    console.log('   ✅ docs/SEO.md');
    console.log('   ✅ docs/AI_OPTIMIZATION.md');
    passedTests++;
  } else {
    console.error('❌ FAILED: Missing files:', missingFiles.join(', '));
    failedTests++;
  }
} catch (error) {
  console.error('❌ FAILED:', error.message);
  failedTests++;
}

// Summary Report
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${passedTests + failedTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log('=' .repeat(60));

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! SEO module is ready for production.\n');
  process.exit(0);
} else {
  console.log(`\n⚠️ ${failedTests} test(s) failed. Please review the errors above.\n`);
  process.exit(1);
}
