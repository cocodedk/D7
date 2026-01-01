#!/usr/bin/env node

/**
 * Fix http-proxy deprecation warning by replacing util._extend with Object.assign
 * This script patches the nested dependency in netlify-cli
 */

const fs = require('fs');
const path = require('path');

const httpProxyBase = path.join(
  __dirname,
  '..',
  'node_modules',
  'netlify-cli',
  'node_modules',
  'http-proxy',
  'lib',
  'http-proxy'
);

const filesToPatch = [
  'index.js',
  'common.js'
];

let patchedCount = 0;
let alreadyPatchedCount = 0;

try {
  if (!fs.existsSync(httpProxyBase)) {
    console.log('⚠ http-proxy not found (netlify-cli may not be installed)');
    process.exit(0);
  }

  filesToPatch.forEach(file => {
    const filePath = path.join(httpProxyBase, file);

    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');

      // Replace util._extend with Object.assign (preserve original spacing)
      const originalPattern = /(extend\s*=\s*)require\s*\(\s*['"]util['"]\s*\)\s*\.\s*_extend(\s*,)/g;
      const replacement = '$1Object.assign$2';

      let wasPatched = false;
      if (originalPattern.test(content)) {
        content = content.replace(originalPattern, replacement);
        wasPatched = true;
      }

      if (wasPatched) {
        fs.writeFileSync(filePath, content, 'utf8');
        patchedCount++;
        console.log(`✓ Patched ${file}`);
      } else if (content.includes('Object.assign')) {
        alreadyPatchedCount++;
      }
    }
  });

  if (patchedCount > 0) {
    console.log(`✓ Fixed http-proxy deprecation warnings in ${patchedCount} file(s)`);
  } else if (alreadyPatchedCount === filesToPatch.length) {
    console.log('✓ http-proxy already patched');
  }
} catch (error) {
  console.error('Error patching http-proxy:', error.message);
  process.exit(1);
}
