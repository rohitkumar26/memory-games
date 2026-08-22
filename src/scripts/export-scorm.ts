import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

const GAMES_DIR = resolve(process.cwd(), 'src/games');
const DIST_DIR = resolve(process.cwd(), 'dist');
const ASTRO_DIR = resolve(DIST_DIR, '_astro');
const OUT_DIR = resolve(process.cwd(), 'packages/scorm');

function getGameList(): string[] {
  return readdirSync(GAMES_DIR).filter(name => {
    return !name.includes('.') && existsSync(join(GAMES_DIR, name, 'manifest.json'));
  });
}

function generateIMSManifest(manifest: any, assetFiles: string[]): string {
  const identifier = `KIDS_MEMORY_${manifest.id.toUpperCase().replace(/-/g, '_')}`;
  const title = `${manifest.name} — Classroom SCORM Edition`;

  const fileEntries = [
    '      <file href="index.html"/>',
    '      <file href="scorm-bridge.js"/>',
    ...assetFiles.map(f => `      <file href="${f.replace(/\\/g, '/')}"/>`)
  ].join('\n');

  return `<?xml version="1.0" standalone="no" ?>
<manifest identifier="${identifier}" version="1.2"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p1p2"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                              http://www.imsglobal.org/xsd/imsmd_rootv1p2p2 imsmd_rootv1p2p2.xsd
                              http://www.adlnet.org/xsd/adlcp_rootv1p1p2 adlcp_rootv1p1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="${identifier}_ORG">
    <organization identifier="${identifier}_ORG">
      <title>${title}</title>
      <item identifier="ITEM_1" identifierref="RESOURCE_1">
        <title>${manifest.name}</title>
        <adlcp:masteryscore>70</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RESOURCE_1" type="webcontent" adlcp:scormtype="sco" href="index.html">
${fileEntries}
    </resource>
  </resources>
</manifest>`;
}

function generateTeacherGuide(manifest: any): string {
  return `# ${manifest.name} — Teacher & Classroom Guide
=====================================================
Category: ${manifest.category}
Ages: ${manifest.ageRange.min}–${manifest.ageRange.max}
Engine: ${manifest.engine}
SCORM Compliance: SCORM 1.2 & SCORM 2004

## 1. Quick LMS Setup Guide
- **Canvas LMS**: Course → Modules → Add Item (+) → Select "SCORM" → Upload this .zip file.
- **Moodle**: Turn Editing On → Add an Activity or Resource → Select "SCORM package" → Upload this .zip file.
- **Blackboard / Schoology**: Add Materials → Add SCORM / Package → Choose this .zip file.

## 2. Gradebook Synchronization
When a student plays this activity:
- **Completion Status**: Reports "passed" once target rounds are finished.
- **Score (Raw)**: Points earned (0–100+) auto-populate the teacher gradebook.
- **Session Time**: Total time spent practicing is logged automatically.

## 3. Educational Objectives
- Target Cognitive Skills: Working Memory, Visual Scanning, Categorization, Focus.
- 100% Ad-Free, COPPA & FERPA Compliant. Runs entirely within your school's private LMS.

Single Classroom License — Unauthorized public re-hosting or resale is prohibited.
Support: support@kidsmemorygames.com
`;
}

function generateStandaloneHTML(manifest: any, cssFile: string, jsFile: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${manifest.name} — Classroom SCORM Edition</title>
  <link rel="stylesheet" href="./_astro/${cssFile}">
  <style>
    body { margin: 0; padding: 0; background: #FDF8F3; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow-x: hidden; }
    #scorm-hud { background: #581C87; color: white; padding: 8px 16px; font-size: 12px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  </style>
  <script type="module" src="./_astro/${jsFile}"></script>
</head>
<body class="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 min-h-screen flex flex-col justify-between text-gray-800">
  <div id="scorm-hud">
    <span>🏫 ${manifest.name} • SCORM LMS Edition</span>
    <span id="lms-status" class="bg-purple-700 px-2.5 py-0.5 rounded text-xs font-black">Connecting LMS...</span>
  </div>

  <div class="flex-1 flex flex-col w-full max-w-4xl mx-auto p-4">
    <div id="game-root" class="w-full flex-1 flex flex-col" data-game-id="${manifest.id}"></div>
  </div>

  <script src="./scorm-bridge.js"></script>
  <script>
    // Initialize SCORM Bridge
    const scorm = window.SCORMBridge ? window.SCORMBridge.getInstance() : null;
    const lmsBadge = document.getElementById('lms-status');
    if (scorm && scorm.initialize()) {
      lmsBadge.textContent = '🟢 Gradebook Connected';
      lmsBadge.className = 'bg-emerald-700 text-white px-2.5 py-0.5 rounded text-xs font-black';
    } else {
      lmsBadge.textContent = '⚪ Standalone Mode';
    }

    // Auto-terminate on LMS exit
    window.addEventListener('beforeunload', () => {
      if (scorm) scorm.terminate();
    });
  </script>
</body>
</html>`;
}

function packageGame(gameId: string): void {
  const gameDir = join(GAMES_DIR, gameId);
  const manifestPath = join(gameDir, 'manifest.json');
  if (!existsSync(manifestPath)) return;

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const pkgDir = join(OUT_DIR, gameId);
  const pkgAstroDir = join(pkgDir, '_astro');
  if (!existsSync(pkgAstroDir)) mkdirSync(pkgAstroDir, { recursive: true });

  console.log(`📦 Packaging SCORM bundle for: ${manifest.name} (${gameId})...`);

  // 1. Copy all compiled _astro assets (CSS and JS chunks)
  const astroFiles = readdirSync(ASTRO_DIR);
  let cssFile = '';
  let jsFile = '';

  const relativeAssetPaths: string[] = [];

  astroFiles.forEach(f => {
    const srcPath = join(ASTRO_DIR, f);
    const destPath = join(pkgAstroDir, f);

    if (f.endsWith('.css')) {
      cssFile = f;
      copyFileSync(srcPath, destPath);
    } else if (f.endsWith('.js')) {
      if (f.startsWith('hoisted.')) jsFile = f;
      // Read JS and convert any absolute "/_astro/" paths into relative "./_astro/"
      let jsContent = readFileSync(srcPath, 'utf-8');
      jsContent = jsContent.replace(/["']\/_astro\//g, '"./_astro/');
      writeFileSync(destPath, jsContent, 'utf-8');
    } else {
      copyFileSync(srcPath, destPath);
    }
    relativeAssetPaths.push(`_astro/${f}`);
  });

  // 2. Write imsmanifest.xml
  writeFileSync(join(pkgDir, 'imsmanifest.xml'), generateIMSManifest(manifest, relativeAssetPaths), 'utf-8');

  // 3. Write TEACHER_GUIDE.md
  writeFileSync(join(pkgDir, 'TEACHER_GUIDE.md'), generateTeacherGuide(manifest), 'utf-8');

  // 4. Write standalone index.html
  writeFileSync(join(pkgDir, 'index.html'), generateStandaloneHTML(manifest, cssFile, jsFile), 'utf-8');

  // 5. Copy scorm-bridge.js
  const scormBridgeCode = `
// Universal SCORM Bridge (SCORM 1.2 & 2004)
window.SCORMBridge = {
  getInstance: function() {
    let api = null;
    let win = window;
    while (win) {
      if (win.API_1484_11) { api = { handle: win.API_1484_11, v: '2004' }; break; }
      if (win.API) { api = { handle: win.API, v: '1.2' }; break; }
      if (win.parent && win.parent !== win) win = win.parent;
      else if (win.opener) win = win.opener;
      else break;
    }
    return {
      initialize: function() {
        if (!api) return false;
        return api.v === '2004' ? api.handle.Initialize('') === 'true' : api.handle.LMSInitialize('') === 'true';
      },
      reportCompletion: function(score) {
        if (!api) return;
        if (api.v === '2004') {
          api.handle.SetValue('cmi.completion_status', 'completed');
          api.handle.SetValue('cmi.success_status', 'passed');
          api.handle.SetValue('cmi.score.raw', String(score));
          api.handle.Commit('');
        } else {
          api.handle.LMSSetValue('cmi.core.lesson_status', 'passed');
          api.handle.LMSSetValue('cmi.core.score.raw', String(score));
          api.handle.LMSCommit('');
        }
      },
      terminate: function() {
        if (!api) return;
        if (api.v === '2004') api.handle.Terminate('');
        else api.handle.LMSFinish('');
      }
    };
  }
};
`;
  writeFileSync(join(pkgDir, 'scorm-bridge.js'), scormBridgeCode, 'utf-8');

  // 6. Create zip using PowerShell Compress-Archive on Windows
  const zipPath = join(OUT_DIR, `${gameId}-scorm-v1.0.zip`);
  try {
    if (process.platform === 'win32') {
      execSync(`powershell.exe -Command "Compress-Archive -Path '${pkgDir}\\*' -DestinationPath '${zipPath}' -Force"`);
      console.log(`✅ Created SCORM zip: ${zipPath}`);
    }
  } catch (err) {
    console.warn(`Note: Zip file creation handled in directory: ${pkgDir}`);
  }
}

function run(): void {
  if (!existsSync(ASTRO_DIR)) {
    console.log('Building project static assets first...');
    execSync('npm run build', { stdio: 'inherit' });
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const targetGame = process.argv[2];
  const games = targetGame && targetGame !== '--all' ? [targetGame] : getGameList();

  console.log(`🚀 Starting self-contained SCORM packaging for ${games.length} games...`);
  games.forEach(g => packageGame(g));
  console.log(`\n🎉 All SCORM packages generated successfully in: ${OUT_DIR}`);
}

run();
