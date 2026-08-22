import { describe, it, expect } from 'vitest';
import { readdirSync, existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import AdmZip from 'adm-zip';

const GAMES_DIR = './src/games';
const SCORM_DIR = './packages/scorm';

function getGameIds(): string[] {
  try {
    return readdirSync(GAMES_DIR).filter(id => {
      const stat = statSync(join(GAMES_DIR, id));
      return stat.isDirectory() && existsSync(join(GAMES_DIR, id, 'manifest.json'));
    });
  } catch {
    return [];
  }
}

const gameIds = getGameIds();

describe('SCORM Package Integrity & Cross-Contamination Prevention', () => {
  it('discovers games to test for SCORM compliance', () => {
    expect(gameIds.length).toBeGreaterThan(0);
  });

  gameIds.forEach(gameId => {
    describe(`Game SCORM Package: ${gameId}`, () => {
      const manifestPath = join(GAMES_DIR, gameId, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      // Check zip file existence
      const zipPath = join(SCORM_DIR, `${gameId}-scorm-v1.0.zip`);

      it(`has a valid generated .zip archive: ${gameId}`, () => {
        expect(existsSync(zipPath), `SCORM zip archive must exist for ${gameId}`).toBe(true);
      });

      it(`contains verified internal files with matching gameId and no cross-contamination`, () => {
        if (!existsSync(zipPath)) return;

        const zip = new AdmZip(zipPath);
        const entries = zip.getEntries().map(e => e.entryName);

        // Core required files
        expect(entries).toContain('index.html');
        expect(entries).toContain('imsmanifest.xml');
        expect(entries).toContain('scorm-bridge.js');
        expect(entries).toContain('TEACHER_GUIDE.md');

        // Read and verify index.html
        const indexHtmlEntry = zip.getEntry('index.html');
        expect(indexHtmlEntry).toBeDefined();
        const indexHtml = indexHtmlEntry ? indexHtmlEntry.getData().toString('utf-8') : '';

        // Must match this exact game's ID and name
        expect(indexHtml).toContain(`data-game-id="${gameId}"`);
        expect(indexHtml).toContain(manifest.name);
        expect(indexHtml).toContain('http-equiv="Cache-Control"');
        expect(indexHtml).toContain('SCORM LMS Edition');

        // Read and verify imsmanifest.xml
        const manifestEntry = zip.getEntry('imsmanifest.xml');
        expect(manifestEntry).toBeDefined();
        const manifestXml = manifestEntry ? manifestEntry.getData().toString('utf-8') : '';

        expect(manifestXml).toContain(`<title>${manifest.name} — Classroom SCORM Edition</title>`);
        expect(manifestXml).toContain(`<title>${manifest.name}</title>`);
        expect(manifestXml).toContain(`KIDS_MEMORY_${gameId.toUpperCase().replace(/-/g, '_')}`);

        // Read and verify scorm-bridge.js
        const bridgeEntry = zip.getEntry('scorm-bridge.js');
        expect(bridgeEntry).toBeDefined();
        const bridgeJs = bridgeEntry ? bridgeEntry.getData().toString('utf-8') : '';
        expect(bridgeJs).toContain('window.SCORMBridge');
        expect(bridgeJs).toContain('reportCompletion');
        expect(bridgeJs).toContain('getSavedState');
      });
    });
  });
});
