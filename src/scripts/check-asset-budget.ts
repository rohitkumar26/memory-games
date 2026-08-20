import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const GAMES_DIR = './src/games';
const BUDGET = 500 * 1024; // 500 KB

function checkGameBudget(gamePath: string): { valid: boolean; size: number; overage: number } {
  const assetsPath = join(gamePath, 'assets');
  let totalSize = 0;

  try {
    const files = readdirSync(assetsPath, { recursive: true }) as string[];
    for (const file of files) {
      const filePath = join(assetsPath, file);
      try {
        const stats = statSync(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      } catch {
        // Skip unreadable files
      }
    }
  } catch {
    // No assets folder = 0 bytes
  }

  return {
    valid: totalSize <= BUDGET,
    size: totalSize,
    overage: Math.max(0, totalSize - BUDGET)
  };
}

function main(): void {
  const gameIds = readdirSync(GAMES_DIR).filter(id => {
    try {
      return statSync(join(GAMES_DIR, id)).isDirectory();
    } catch {
      return false;
    }
  });

  let failed = false;

  console.log('\n📦 Asset Budget Check\n');
  console.log(`Budget: ${(BUDGET / 1024).toFixed(0)} KB per game\n`);

  for (const gameId of gameIds) {
    const result = checkGameBudget(join(GAMES_DIR, gameId));
    const sizeKB = (result.size / 1024).toFixed(1);
    const status = result.valid ? '✅ PASS' : '❌ FAIL';

    console.log(`${status} ${gameId}: ${sizeKB} KB${result.overage > 0 ? ` (+${(result.overage / 1024).toFixed(1)} KB over)` : ''}`);

    if (!result.valid) failed = true;
  }

  console.log('');

  if (failed) {
    console.error('❌ Budget check failed! Reduce asset sizes or increase budget.');
    process.exit(1);
  } else {
    console.log('✅ All games within budget.\n');
  }
}

main();
