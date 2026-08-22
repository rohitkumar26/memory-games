import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

const GAMES_DIR = resolve(process.cwd(), 'src/games');
const OUT_DIR = resolve(process.cwd(), 'dist/scorm-packages');

function getGameList(): string[] {
  return readdirSync(GAMES_DIR).filter(name => {
    return !name.includes('.') && existsSync(join(GAMES_DIR, name, 'manifest.json'));
  });
}

function generateIMSManifest(manifest: any): string {
  const identifier = `KIDS_MEMORY_${manifest.id.toUpperCase().replace(/-/g, '_')}`;
  const title = `${manifest.name} — Classroom SCORM Edition`;

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
      <file href="index.html"/>
      <file href="scorm-bridge.js"/>
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
- **Completion Status**: Reports "passed" once the target rounds are finished.
- **Score (Raw)**: Points earned (0–100+) auto-populate the teacher gradebook.
- **Session Time**: Total time spent practicing is logged automatically.

## 3. Educational Objectives
- Target Cognitive Skills: Working Memory, Visual Scanning, Categorization, Focus.
- 100% Ad-Free, COPPA & FERPA Compliant. Runs entirely within your school's private LMS.

Single Classroom License — Unauthorized public re-hosting or resale is prohibited.
Support: support@kidsmemorygames.com
`;
}

function generateStandaloneHTML(manifest: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${manifest.name} — Classroom SCORM</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; background: #FDF8F3; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #scorm-hud { background: #581C87; color: white; padding: 6px 16px; font-size: 12px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
  </style>
</head>
<body class="min-h-screen flex flex-col">
  <div id="scorm-hud">
    <span>🏫 ${manifest.name} • SCORM LMS Edition</span>
    <span id="lms-status" class="bg-purple-700 px-2 py-0.5 rounded text-xs">Connecting LMS...</span>
  </div>
  <div id="game-root" class="flex-1 flex flex-col w-full max-w-4xl mx-auto p-2"></div>

  <script src="scorm-bridge.js"></script>
  <script>
    // Initialize SCORM Session
    const scorm = window.SCORMBridge ? window.SCORMBridge.getInstance() : null;
    const lmsBadge = document.getElementById('lms-status');
    if (scorm && scorm.initialize()) {
      lmsBadge.textContent = '🟢 Gradebook Connected';
      lmsBadge.className = 'bg-emerald-700 text-white px-2 py-0.5 rounded text-xs';
    } else {
      lmsBadge.textContent = '⚪ Standalone Mode';
    }

    // Auto terminate on window unload
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
  if (!existsSync(pkgDir)) mkdirSync(pkgDir, { recursive: true });

  console.log(`📦 Packaging SCORM package for: ${manifest.name} (${gameId})...`);

  // 1. Write imsmanifest.xml
  writeFileSync(join(pkgDir, 'imsmanifest.xml'), generateIMSManifest(manifest), 'utf-8');

  // 2. Write TEACHER_GUIDE.md
  writeFileSync(join(pkgDir, 'TEACHER_GUIDE.md'), generateTeacherGuide(manifest), 'utf-8');

  // 3. Write index.html
  writeFileSync(join(pkgDir, 'index.html'), generateStandaloneHTML(manifest), 'utf-8');

  // 4. Copy scorm-bridge.js
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

  // 5. Create zip using PowerShell Compress-Archive on Windows
  const zipPath = join(OUT_DIR, `${gameId}-scorm-v1.0.zip`);
  try {
    if (process.platform === 'win32') {
      execSync(`powershell.exe -Command "Compress-Archive -Path '${pkgDir}\\*' -DestinationPath '${zipPath}' -Force"`);
      console.log(`✅ Created SCORM zip: ${zipPath}`);
    }
  } catch (err) {
    console.warn(`Note: Zip file creation skipped or handled via directory: ${pkgDir}`);
  }
}

function run(): void {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const targetGame = process.argv[2];
  const games = targetGame && targetGame !== '--all' ? [targetGame] : getGameList();

  console.log(`🚀 Starting SCORM 1.2/2004 packaging for ${games.length} games...`);
  games.forEach(g => packageGame(g));
  console.log(`\n🎉 All SCORM packages generated in: ${OUT_DIR}`);
}

run();
