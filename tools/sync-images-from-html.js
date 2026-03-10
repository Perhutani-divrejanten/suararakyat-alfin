/**
 * sync-images-from-html.js
 * Script untuk sinkronisasi gambar dari HTML files ke articles.json
 * Berguna ketika articles.json memiliki image yang salah
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_JSON_PATH = path.resolve(__dirname, '../articles.json');
const OUT_DIR = path.resolve(__dirname, '../article');

function extractFirstImage(htmlContent) {
  // Look for img-fluid w-100 (main article image)
  const fluidMatch = htmlContent.match(/<img[^>]*class="[^"]*img-fluid[^"]*w-100[^"]*"[^>]*src="([^"]+)"/);
  if (fluidMatch && fluidMatch[1]) {
    let src = fluidMatch[1];
    if (!src.includes('cewe') && !src.includes('cowok') && !src.includes('alfin.jpg')) {
      // Normalize relative paths
      const normalizedSrc = src.replace('../img/', 'img/');
      return normalizedSrc;
    }
  }
  
  // Fallback to first regular img
  const imgMatch = htmlContent.match(/<img[^>]*src="([^"]+)"[^>]*>/);
  if (imgMatch && imgMatch[1]) {
    let src = imgMatch[1];
    if (!src.includes('cewe') && !src.includes('cowok') && !src.includes('alfin.jpg')) {
      const normalizedSrc = src.replace('../img/', 'img/');
      return normalizedSrc;
    }
  }
  
  return null;
}

async function syncImagesFromHTML() {
  try {
    // Read existing articles.json
    if (!fs.existsSync(ARTICLES_JSON_PATH)) {
      console.error('❌ articles.json not found!');
      return;
    }

    let articles = JSON.parse(fs.readFileSync(ARTICLES_JSON_PATH, 'utf8'));
    console.log(`📂 Loaded ${articles.length} articles from articles.json`);

    // Scan HTML files for images
    let fixedCount = 0;
    const htmlFiles = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.html'));

    for (const article of articles) {
      // Get article slug from URL
      let slug = null;
      if (article.url) {
        // Extract filename without .html
        slug = article.url.replace('article/', '').replace('.html', '');
      } else if (article.slug) {
        slug = article.slug;
      }

      if (!slug) continue;

      // Look for HTML file
      const htmlFile = path.join(OUT_DIR, `${slug}.html`);
      if (!fs.existsSync(htmlFile)) {
        console.log(`   ⚠️  HTML file not found: ${slug}.html`);
        continue;
      }

      try {
        const htmlContent = fs.readFileSync(htmlFile, 'utf8');
        const extractedImage = extractFirstImage(htmlContent);

        if (extractedImage && extractedImage !== article.image) {
          console.log(`   ✏️  ${slug}`);
          console.log(`      Before: ${article.image}`);
          console.log(`      After:  ${extractedImage}`);
          article.image = extractedImage;
          fixedCount++;
        }
      } catch (err) {
        console.warn(`   ⚠️  Error reading ${htmlFile}:`, err.message);
      }
    }

    if (fixedCount > 0) {
      // Backup existing articles.json
      const timestamp = Math.floor(Date.now() / 1000);
      const backupPath = `${ARTICLES_JSON_PATH}.bak.sync.${timestamp}`;
      fs.copyFileSync(ARTICLES_JSON_PATH, backupPath);
      console.log(`\n✅ Backup created: ${path.basename(backupPath)}`);

      // Write updated articles.json
      fs.writeFileSync(ARTICLES_JSON_PATH, JSON.stringify(articles, null, 2));
      console.log(`✅ Updated articles.json: ${fixedCount} image(s) fixed`);
    } else {
      console.log('✅ All images are correct - no changes needed');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

// Run
console.log('🔄 Syncing images from HTML files to articles.json...\n');
syncImagesFromHTML();