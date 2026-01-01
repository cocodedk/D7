#!/usr/bin/env node

/**
 * Fix http-proxy deprecation warning by replacing util._extend with Object.assign
 * This script patches the nested dependency in netlify-cli
 */

const fs = require('fs');
const path = require('path');

const httpProxyPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'netlify-cli',
  'node_modules',
  'http-proxy',
  'lib',
  'http-proxy',
  'index.js'
);

try {
  if (fs.existsSync(httpProxyPath)) {
    let content = fs.readFileSync(httpProxyPath, 'utf8');

    // Replace util._extend with Object.assign
    const original = "extend    = require('util')._extend,";
    const replacement = "extend    = Object.assign,";

    if (content.includes(original)) {
      content = content.replace(original, replacement);
      fs.writeFileSync(httpProxyPath, content, 'utf8');
      console.log('✓ Fixed http-proxy deprecation warning');
    } else if (content.includes(replacement)) {
      console.log('✓ http-proxy already patched');
    } else {
      console.log('⚠ http-proxy file structure may have changed');
    }
  } else {
    console.log('⚠ http-proxy not found (netlify-cli may not be installed)');
  }
} catch (error) {
  console.error('Error patching http-proxy:', error.message);
  process.exit(1);
}
