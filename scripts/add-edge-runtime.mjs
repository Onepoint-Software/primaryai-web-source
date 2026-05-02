import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const files = execSync(
  'find /Users/glenncooke/primaryAI-source/primaryai-web-source/app -type f -name "page.js" -o -type f -name "page.tsx" -o -type f -name "route.js" -o -type f -name "route.ts"'
).toString().trim().split('\n').filter(Boolean);

let updated = 0, skipped = 0;

for (const file of files) {
  const content = readFileSync(file, 'utf8');

  if (content.includes("'use client'") || content.includes('"use client"')) {
    skipped++;
    continue;
  }

  if (content.includes('export const runtime')) {
    skipped++;
    continue;
  }

  let newContent;
  if (content.startsWith("'use server'") || content.startsWith('"use server"')) {
    newContent = content.replace(/^(["'](use server)["'])/, "$1\nexport const runtime = 'edge';");
  } else {
    newContent = "export const runtime = 'edge';\n" + content;
  }

  writeFileSync(file, newContent);
  updated++;
}

console.log(`Updated: ${updated} | Skipped (client/already set): ${skipped}`);
