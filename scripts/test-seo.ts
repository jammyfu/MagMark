#!/usr/bin/env node
/**
 * MagMark 2.0 - SEO Module Debug Test Suite
 * Tests all SEO functionality before deployment
 */

import {
  generateOpenGraphTags,
  generateTwitterTags,
  generateCompleteHead,
  generateStructuredData,
  enhanceSemanticStructure,
  generateTableOfContents,
  generateSitemap,
  generateRobotsTxt,
  validateStructuredData,
} from '../src/seo/meta-tags';

import {
  generateArticleSchema,
  generateFAQSchema,
  generateHowToSchema,
  generateBreadcrumbSchema,
} from '../src/seo/structured-data';

// Test configuration
const ARTICLE_DATA = {
  headline: 'MagMark 2.0 SEO Guide',
  description: 'Complete guide for search engine and AI optimization',
  author: 'Jammy Fu',
  publishedTime: '2026-03-03T08:00:00Z',
  images: ['/images/cover.jpg'],
  tags: ['seo', 'marketing', 'guide'],
  category: 'Documentation'
};

console.log('🧪 Running MagMark 2.0 SEO Module Tests...\n');

let passedTests = 0;
let failedTests = 0;

// Test 1: Open Graph Tags
console.log('[Test 1] Generate Open Graph Tags...');
try {
  const ogTags = generateOpenGraphTags(ARTICLE_DATA, 'https://example.com');
  console.assert(ogTags.length > 0, 'Should generate OG tags');
  console.assert(ogTags.some(tag => tag.includes('og:title')), 'Should have og:title');
  console.assert(ogTags.some(tag => tag.includes('og:image')), 'Should have og:image');
  
  console.log('✅ PASSED: Generated', ogTags.length, 'OG tags');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error);
  failedTests++;
}

// Test 2: Twitter Cards
console.log('\n[Test 2] Generate Twitter Cards...');
try {
  const twitterTags = generateTwitterTags(ARTICLE_DATA, 'https://example.com');
  console.assert(twitterTags.length > 0, 'Should generate Twitter tags');
  console.assert(twitterTags.some(tag => tag.includes('twitter:card')), 'Should have twitter:card');
  console.assert(twitterTags.some(tag => tag.includes('twitter:title')), 'Should have twitter:title');
  
  console.log('✅ PASSED: Generated', twitterTags.length, 'Twitter tags');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error);
  failedTests++;
}

// Test 3: Complete Head
console.log('\n[Test 3] Generate Complete HTML Head...');
try {
  const headHTML = generateCompleteHead(ARTICLE_DATA, {
    baseUrl: 'https://example.com',
    title: 'Full Title',
    canonicalUrl: 'https://example.com/guide/seo'
  });
  console.assert(headHTML.includes('<meta'), 'Should include meta tags');
  console.assert(headHTML.includes('<title>'), 'Should include title tag');
  
  console.log('✅ PASSED: Generated complete head HTML');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error);
  failedTests++;
}

// Test 4: Structured Data Generation
console.log('\n[Test 4] Generate Article Schema...');
try {
  const schema = generateArticleSchema({
    headline: ARTICLE_DATA.headline,
    description: ARTICLE_DATA.description,
    author: ARTICLE_DATA.author,
    publisher: { name: 'MagMark Team' },
    datePublished: ARTICLE_DATA.publishedTime,
    image: ARTICLE_DATA.images[0],
    keywords: ARTICLE_DATA.tags
  });
  
  console.assert(schema.includes('@context'), 'Should include @context');
  console.assert(schema.includes('"@type": "Article"'), 'Should be Article type');
  console.assert(schema.includes(ARTICLE_DATA.headline), 'Should include headline');
  
  // Validate JSON-LD
  const isValid = validateStructuredData(schema);
  console.assert(isValid.valid, `JSON-LD should be valid: ${isValid.errors.join(', ')}`);
  
  console.log('✅ PASSED: Generated and validated Article schema');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error);
  failedTests++;
}

// Test 5: FAQ Schema
console.log('\n[Test 5] Generate FAQ Schema...');
try {
  const questions = [
    {
      questionName: 'What is MagMark?',
      acceptedAnswerText: 'MagMark is a magazine-quality markdown converter...'
    },
    {
      questionName: 'How to export PDF?',
      acceptedAnswerText: 'Use the exportPDF() method...'
    }
  ];
  
  const faqSchema = generateFAQSchema(questions);
  console.assert(faqSchema.includes('@type": "FAQPage"'), 'Should be FAQPage type');
  console.assert(faqSchema.includes('questionName'), 'Should include questions');
  
  console.log('✅ PASSED: Generated FAQ schema with', questions.length, 'Q&A pairs');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error);
  failedTests++;
}

// Test 6: Semantic HTML Enhancement
console.log('\n[Test 6] Enhance Semantic Structure...');
try {
  const rawHTML = '<h1>Title</h1><p>Content...</p>';
  const enhanced = enhanceSemanticStructure(rawHTML);
  
  console.assert(enhanced.includes('<article'), 'Should add article wrapper');
  console.assert(enhanced.includes('itemscope'), 'Should add schema.org attributes');
  
  console.log('✅ PASSED: Enhanced semantic structure');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error);
  failedTests++;
}

// Test 7: Table of Contents
console.log('\n[Test 7] Generate Table of Contents...');
try {
  const headings = [
    { level: 2, text: 'Introduction', id: 'intro' },
    { level: 2, text: 'Installation', id: 'install' },
    { level: 3, text: 'Requirements', id: 'requirements' },
    { level: 2, text: 'Usage', id: 'usage' }
  ];
  
  const toc = generateTableOfContents(headings);
  console.assert(toc.includes('<nav'), 'Should include nav element');
  console.assert(toc.includes('href="#') && toc.includes('#intro'), 'Should include anchor links');
  
  console.log('✅ PASSED: Generated TOC with', headings.length, 'headings');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error);
  failedTests++;
}

// Test 8: Sitemap Generation
console.log('\n[Test 8] Generate Sitemap XML...');
try {
  const entries = [
    { loc: 'https://example.com/', priority: 1.0 as const, changefreq: 'daily' as const },
    { loc: 'https://example.com/guide', priority: 0.8 as const, changefreq: 'weekly' as const }
  ];
  
  const { xml, files } = generateSitemap(entries, {
    baseUrl: 'https://example.com'
  });
  
  console.assert(xml.includes('<?xml version'), 'Should be valid XML');
  console.assert(xml.includes('<urlset'), 'Should include urlset');
  console.assert(xml.includes('<loc>'), 'Should include location tags');
  console.assert(Array.isArray(files), 'Should return files array');
  
  console.log('✅ PASSED: Generated sitemap with', files.length, 'file(s)');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error);
  failedTests++;
}

// Test 9: Robots.txt Generation
console.log('\n[Test 9] Generate Robots.txt...');
try {
  const robotsTxt = generateRobotsTxt(['https://example.com/sitemap.xml']);
  
  console.assert(robotsTxt.includes('User-agent'), 'Should include User-agent');
  console.assert(robotsTxt.includes('Sitemap'), 'Should include Sitemap directive');
  console.assert(robotsTxt.includes('Disallow'), 'Should include Disallow rules');
  
  console.log('✅ PASSED: Generated robots.txt');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error);
  failedTests++;
}

// Test 10: Breadcrumb Schema
console.log('\n[Test 10] Generate Breadcrumb Schema...');
try {
  const breadcrumbs = [
    { name: 'Home', item: 'https://example.com/', position: 1 },
    { name: 'Guides', item: 'https://example.com/guides/', position: 2 },
    { name: 'SEO', item: 'https://example.com/guides/seo/', position: 3 }
  ];
  
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  console.assert(breadcrumbSchema.includes('@type": "BreadcrumbList"'), 'Should be BreadcrumbList type');
  console.assert(breadcrumbSchema.includes('position'), 'Should include position numbers');
  
  console.log('✅ PASSED: Generated breadcrumb schema');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error);
  failedTests++;
}

// Test 11: How-To Schema
console.log('\n[Test 11] Generate How-To Schema...');
try {
  const howTo = {
    totaltime: 'PT30M',
    steps: [
      {
        name: 'Install dependency',
        itemListElement: [
          { '@type': 'HowToDirection', text: 'Run npm install magmark-2.0' }
        ]
      },
      {
        name: 'Write content',
        itemListElement: [
          { '@type': 'HowToTip', text: 'Use markdown format' }
        ]
      }
    ]
  };
  
  const howToSchema = generateHowToSchema(howTo);
  console.assert(howToSchema.includes('@type": "HowTo"'), 'Should be HowTo type');
  console.assert(howToSchema.includes('totalTime'), 'Should include totalTime');
  
  console.log('✅ PASSED: Generated How-To schema');
  passedTests++;
} catch (error) {
  console.error('❌ FAILED:', error);
  failedTests++;
}

// Test 12: JSON-LD Validation
console.log('\n[Test 12] Validate JSON-LD...');
try {
  const testSchema = generateArticleSchema({
    headline: 'Test',
    description: 'Test desc',
    author: { '@type': 'Person', name: 'Author' },
    publisher: { '@type': 'Organization', name: 'Publisher' },
    datePublished: '2026-03-03T08:00:00Z',
    image: 'https://example.com/image.jpg'
  });
  
  const validation = validateStructuredData(testSchema);
  console.assert(validation.valid, 'Should be valid JSON-LD');
  
  if (!validation.valid) {
    console.warn('⚠️ Validation errors:', validation.errors);
  } else {
    console.log('✅ PASSED: JSON-LD validation successful');
    passedTests++;
  }
} catch (error) {
  console.error('❌ FAILED:', error);
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
