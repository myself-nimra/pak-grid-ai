/**
 * postbuild.js
 * Copies public/ and .next/static/ into the standalone build output
 * so Hostinger's Node.js hosting can serve assets correctly.
 */
const fs = require("fs");
const path = require("path");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log("[postbuild] Copying public/ → .next/standalone/public/");
copyRecursive("public", path.join(".next", "standalone", "public"));

console.log("[postbuild] Copying .next/static/ → .next/standalone/.next/static/");
copyRecursive(
  path.join(".next", "static"),
  path.join(".next", "standalone", ".next", "static")
);

console.log("[postbuild] Done. Standalone build is ready.");
