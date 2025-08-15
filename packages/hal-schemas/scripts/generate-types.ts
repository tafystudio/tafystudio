#!/usr/bin/env node

import { compileFromFile } from 'json-schema-to-typescript';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

async function generateTypes() {
  const schemasDir = path.join(__dirname, '..', 'schemas');
  const outputDir = path.join(__dirname, '..', 'src', 'types');
  
  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });
  
  // Create index file content
  let indexContent = '// Auto-generated types from JSON schemas\n\n';
  
  // Process all schema files
  indexContent = await processDirectory(schemasDir, outputDir, '', indexContent);
  
  // Write the index file
  await writeFile(
    path.join(outputDir, 'index.ts'),
    indexContent + '\n'
  );
  
  console.log('✅ TypeScript types generated successfully!');
}

async function processDirectory(
  inputDir: string,
  outputDir: string,
  relativePath: string,
  indexContent: string
): Promise<string> {
  const entries = await readdir(inputDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const inputPath = path.join(inputDir, entry.name);
    const outputPath = path.join(outputDir, relativePath);
    
    if (entry.isDirectory()) {
      await mkdir(path.join(outputPath, entry.name), { recursive: true });
      indexContent = await processDirectory(
        inputPath,
        outputDir,
        path.join(relativePath, entry.name),
        indexContent
      );
    } else if (entry.name.endsWith('.json')) {
      const baseName = path.basename(entry.name, '.json');
      const typeName = toPascalCase(baseName);
      const outputFile = path.join(outputPath, `${baseName}.ts`);
      
      try {
        const ts = await compileFromFile(inputPath, {
          bannerComment: '/* eslint-disable */',
          style: {
            printWidth: 100,
            singleQuote: true,
          },
        });
        
        await writeFile(outputFile, ts);
        
        // Add to index
        const importPath = relativePath
          ? `./${path.join(relativePath, baseName)}`
          : `./${baseName}`;
        indexContent += `export * from '${importPath}';\n`;
        
        console.log(`Generated: ${outputFile}`);
      } catch (error) {
        console.error(`Failed to generate types for ${inputPath}:`, error);
      }
    }
  }
  
  return indexContent;
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Run the generator
generateTypes().catch(error => {
  console.error('Error generating types:', error);
  process.exit(1);
});