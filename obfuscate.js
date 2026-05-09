// Code Obfuscation Script for WiFi Hunter
// Run: node obfuscate.js

const fs = require('fs');
const path = require('path');

// Simple obfuscation: minify and rename variables
function obfuscateCode(code) {
  // Remove comments
  code = code.replace(/\/\/.*/g, '');
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove extra whitespace
  code = code.replace(/\s+/g, ' ');
  code = code.trim();
  
  // Base64 encode for basic protection
  const encoded = Buffer.from(code).toString('base64');
  
  return `
// WiFi Hunter - Protected Code
(function() {
  const encoded = "${encoded}";
  const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
  eval(decoded);
})();
`;
}

// Obfuscate main index.html
const indexPath = path.join(__dirname, 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

// Extract script content
const scriptMatch = indexContent.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  const scriptContent = scriptMatch[1];
  const obfuscated = obfuscateCode(scriptContent);
  
  // Replace script with obfuscated version
  const obfuscatedIndex = indexContent.replace(scriptMatch[0], `<script>${obfuscated}</script>`);
  
  // Write obfuscated version
  fs.writeFileSync(path.join(__dirname, 'index.obfuscated.html'), obfuscatedIndex);
  console.log('Obfuscated version saved as index.obfuscated.html');
}

console.log('Obfuscation complete');
