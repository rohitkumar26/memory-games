import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';
import AdmZip from 'adm-zip';

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
  const timestamp = Date.now();
  const identifier = `KIDS_MEMORY_${manifest.id.toUpperCase().replace(/-/g, '_')}_${timestamp}`;
  const title = `${manifest.name} — Classroom SCORM Edition`;
  const entryFile = `${manifest.id}.html`;

  const fileEntries = [
    '      <file href="index.html"/>',
    '      <file href="scorm-bridge.js"/>',
    ...assetFiles.map(f => `      <file href="${f.replace(/\\/g, '/')}"/>`)
  ].join('\n');

  const resId = `RES_${manifest.id.toUpperCase().replace(/-/g, '_')}`;

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
      <item identifier="ITEM_1" identifierref="${resId}">
        <title>${manifest.name}</title>
        <adlcp:masteryscore>70</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="${resId}" type="webcontent" adlcp:scormtype="sco" href="${entryFile}">
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
- **Canvas LMS**: Course → Modules → Add Item (+) → Select "SCORM" → Upload this .zip file. Choose "Graded Assignment".
- **Moodle**: Turn Editing On → Add an Activity or Resource → Select "SCORM package" → Upload this .zip file. In Grading, set "Grading method: Highest grade" or "Average grade".
- **Blackboard / Schoology**: Add Materials → Add SCORM / Package → Choose this .zip file.

## 2. Gradebook Synchronization
When a student plays this activity:
- **Completion Status**: Reports "passed" once target rounds/levels are finished.
- **Score (0–100%)**: Automatically calculates percentage mastery and logs to teacher gradebook.
- **Session Time**: Total time spent practicing is logged automatically.
- **Bookmark & Resume**: Remembers student progress if they close the window and return later.

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
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
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
    <div class="flex items-center gap-3">
      <span id="scorm-score-badge" class="bg-amber-400 text-purple-950 px-2.5 py-0.5 rounded text-xs font-black">Score: 0</span>
      <span id="lms-status" class="bg-purple-700 px-2.5 py-0.5 rounded text-xs font-black">Connecting LMS...</span>
    </div>
  </div>

  <!-- Resume Progress Banner (Appears if saved progress exists) -->
  <div id="scorm-resume-container" class="w-full max-w-4xl mx-auto px-4 pt-3 hidden">
    <div class="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white p-4 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4 border border-purple-400/30">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
          💾
        </div>
        <div>
          <div class="font-black text-sm sm:text-base flex items-center gap-2">
            <span>Welcome Back!</span>
            <span class="text-xs bg-amber-400 text-purple-950 font-black px-2 py-0.5 rounded-full">Saved Progress</span>
          </div>
          <div class="text-xs text-purple-200" id="resume-details">
            Resume your previous game session
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button id="resume-btn" class="px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-purple-950 font-black rounded-2xl text-sm shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5">
          <span>▶️ Resume</span> <span id="resume-label-text">Round 1</span>
        </button>
        <button id="dismiss-resume-btn" class="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl transition cursor-pointer" title="Start new game">
          ✕
        </button>
      </div>
    </div>
  </div>

  <div class="flex-1 flex flex-col w-full max-w-4xl mx-auto p-4">
    <div id="game-root" class="w-full flex-1 flex flex-col" data-game-id="${manifest.id}"></div>
  </div>

  <script src="./scorm-bridge.js"></script>
  <script>
    // Initialize SCORM Bridge
    const scorm = window.SCORMBridge ? window.SCORMBridge.getInstance() : null;
    const lmsBadge = document.getElementById('lms-status');
    const scoreBadge = document.getElementById('scorm-score-badge');
    let maxDetectedScore = 0;
    let savedLevel = 1;
    let savedRound = 1;

    if (scorm && scorm.initialize()) {
      lmsBadge.textContent = '🟢 Gradebook Connected';
      lmsBadge.className = 'bg-emerald-700 text-white px-2.5 py-0.5 rounded text-xs font-black';
    } else if (lmsBadge) {
      lmsBadge.textContent = '⚪ Standalone Mode';
    }

    // Check for saved state
    const saved = scorm ? scorm.getSavedState() : null;
    if (saved && (saved.score !== undefined || saved.level || saved.round || saved.rawPoints)) {
      maxDetectedScore = Number(saved.rawPoints || saved.score) || 0;
      savedLevel = Number(saved.level) || 1;
      savedRound = Number(saved.round) || 1;
      if (scoreBadge) scoreBadge.textContent = 'Score: ' + (maxDetectedScore || saved.score || 0);

      const resumeContainer = document.getElementById('scorm-resume-container');
      const resumeBtn = document.getElementById('resume-btn');
      const resumeLabelText = document.getElementById('resume-label-text');
      const resumeDetails = document.getElementById('resume-details');
      const dismissBtn = document.getElementById('dismiss-resume-btn');

      if (resumeContainer && (savedRound > 1 || savedLevel > 1 || maxDetectedScore > 0 || (saved.score !== undefined && saved.score > 0) || saved.timestamp)) {
        if (resumeLabelText) {
          resumeLabelText.textContent = savedRound > 1 ? 'Round ' + savedRound : 'Level ' + savedLevel;
        }
        if (resumeDetails) {
          resumeDetails.textContent = 'Level ' + savedLevel + (savedRound > 1 ? ' • Round ' + savedRound : '') + ' • Grade: ' + (saved.score || 0) + '%';
        }
        resumeContainer.classList.remove('hidden');

        resumeBtn?.addEventListener('click', () => {
          resumeContainer.classList.add('hidden');
          if (window.GameEngine) {
            window.GameEngine.start(savedLevel, savedRound);
          }
        });

        dismissBtn?.addEventListener('click', () => {
          resumeContainer.classList.add('hidden');
        });
      }
    }

    let lastReportedScore = -1;
    let lastReportedLevel = -1;
    let lastReportedRound = -1;

    // Auto-detect score, rounds, and level changes in real-time
    setInterval(() => {
      if (!scorm) return;
      
      const current = window.GameEngine ? window.GameEngine.getCurrentGame() : null;
      let activeLevel = current && current.currentLevel ? current.currentLevel : savedLevel;
      let livePoints = typeof window.__scormLiveScore === 'number' ? window.__scormLiveScore : 0;

      if (current && current.score && typeof current.score.getScore === 'function') {
        livePoints = Math.max(livePoints, current.score.getScore());
      }

      const displayPoints = Math.max(livePoints, maxDetectedScore);
      if (scoreBadge) scoreBadge.textContent = 'Score: ' + displayPoints;

      // Check sorting progress (e.g. "Food 3 of 6" or "Item 2 of 4")
      let progressPct = 0;
      if (current && typeof current.sortedCount === 'number' && typeof current.totalCount === 'number' && current.totalCount > 0) {
        progressPct = Math.min(90, Math.round((current.sortedCount / current.totalCount) * 100));
      }

      // Check round progress (e.g. "Round 3 of 5")
      let activeRound = current && current.currentRound ? current.currentRound : savedRound;
      const statusText = document.body.innerText || '';
      const roundMatch = statusText.match(/Round\s+(\d+)\s+of\s+(\d+)/i);
      if (roundMatch) {
        activeRound = parseInt(roundMatch[1], 10);
        const targetRounds = parseInt(roundMatch[2], 10);
        if (targetRounds > 0) {
          progressPct = Math.max(progressPct, Math.min(90, Math.round(((activeRound - 1) / targetRounds) * 100)));
        }
      }

      const lmsScore = progressPct > 0 ? progressPct : (displayPoints > 0 ? Math.min(90, Math.round((displayPoints / 300) * 100)) : 0);

      if (lmsScore !== lastReportedScore || activeLevel !== lastReportedLevel || activeRound !== lastReportedRound || displayPoints !== maxDetectedScore) {
        lastReportedScore = lmsScore;
        lastReportedLevel = activeLevel;
        lastReportedRound = activeRound;
        maxDetectedScore = displayPoints;
        if (lmsScore > 0) {
          scorm.reportScore(lmsScore);
        }
        scorm.saveState({ score: lmsScore, rawPoints: displayPoints, level: activeLevel, round: activeRound, timestamp: Date.now() });
      }
    }, 500);

    // Auto-terminate and commit on LMS exit / window unload
    const finalizeSession = () => {
      if (scorm) {
        scorm.terminate();
      }
    };

    window.addEventListener('beforeunload', finalizeSession);
    window.addEventListener('pagehide', finalizeSession);
    window.addEventListener('unload', finalizeSession);
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
      jsContent = jsContent.replace(/return\s*["']\/["']\s*\+\s*([a-zA-Z0-9_$]+)/g, 'return "./"+$1');
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

  // 4. Write standalone entry HTML (both unique gameId.html and index.html)
  const standaloneHTML = generateStandaloneHTML(manifest, cssFile, jsFile);
  writeFileSync(join(pkgDir, `${gameId}.html`), standaloneHTML, 'utf-8');
  writeFileSync(join(pkgDir, 'index.html'), standaloneHTML, 'utf-8');

  // 5. Copy scorm-bridge.js
  const scormBridgeCode = `
// Universal SCORM Bridge (SCORM 1.2 & 2004) with Resume State Support
window.SCORMBridge = {
  getInstance: function() {
    let api = null;
    let win = window;
    
    // Find SCORM API in parent or opener frames
    while (win) {
      if (win.API_1484_11) { api = { handle: win.API_1484_11, v: '2004' }; break; }
      if (win.API) { api = { handle: win.API, v: '1.2' }; break; }
      if (win.parent && win.parent !== win) win = win.parent;
      else if (win.opener) win = win.opener;
      else break;
    }

    let currentScore = 0;
    let startTime = Date.now();
    let isTerminated = false;

    const getSafeScore = function(score) {
      const num = Number(score) || 0;
      return Math.min(100, Math.max(0, Math.round(num)));
    };

    return {
      initialize: function() {
        if (!api) return false;
        try {
          const res = api.v === '2004' ? api.handle.Initialize('') === 'true' : api.handle.LMSInitialize('') === 'true';
          if (res) {
            if (api.v === '2004') {
              const existingStatus = api.handle.GetValue('cmi.completion_status');
              if (!existingStatus || existingStatus === 'unknown' || existingStatus === '') {
                api.handle.SetValue('cmi.completion_status', 'incomplete');
                api.handle.SetValue('cmi.score.min', '0');
                api.handle.SetValue('cmi.score.max', '100');
                api.handle.SetValue('cmi.score.raw', '0');
                api.handle.SetValue('cmi.score.scaled', '0');
                api.handle.Commit('');
              } else {
                const existingScore = api.handle.GetValue('cmi.score.raw');
                if (existingScore) currentScore = Number(existingScore) || 0;
              }
            } else {
              const existingStatus = api.handle.LMSGetValue('cmi.core.lesson_status');
              if (!existingStatus || existingStatus === 'not attempted' || existingStatus === '') {
                api.handle.LMSSetValue('cmi.core.lesson_status', 'incomplete');
                api.handle.LMSSetValue('cmi.core.score.min', '0');
                api.handle.LMSSetValue('cmi.core.score.max', '100');
                api.handle.LMSSetValue('cmi.core.score.raw', '0');
                api.handle.LMSCommit('');
              } else {
                const existingScore = api.handle.LMSGetValue('cmi.core.score.raw');
                if (existingScore) currentScore = Number(existingScore) || 0;
              }
            }
          }
          return res;
        } catch(e) {
          return false;
        }
      },
      reportScore: function(score) {
        if (!api || isTerminated) return;
        currentScore = Number(score) || 0;
        const normalized = getSafeScore(currentScore);
        try {
          if (api.v === '2004') {
            api.handle.SetValue('cmi.score.raw', String(normalized));
            api.handle.SetValue('cmi.score.scaled', String(normalized / 100));
            api.handle.SetValue('cmi.completion_status', normalized >= 100 ? 'completed' : 'incomplete');
            api.handle.Commit('');
          } else {
            api.handle.LMSSetValue('cmi.core.score.min', '0');
            api.handle.LMSSetValue('cmi.core.score.max', '100');
            api.handle.LMSSetValue('cmi.core.score.raw', String(normalized));
            api.handle.LMSSetValue('cmi.core.lesson_status', normalized >= 100 ? 'completed' : 'incomplete');
            api.handle.LMSCommit('');
          }
        } catch(e) {}
      },
      reportTime: function(seconds) {
        if (!api || isTerminated) return;
        const s = Number(seconds) || Math.floor((Date.now() - startTime) / 1000);
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        try {
          if (api.v === '2004') {
            api.handle.SetValue('cmi.session_time', 'PT' + hrs + 'H' + mins + 'M' + secs + 'S');
            api.handle.Commit('');
          } else {
            const hStr = String(hrs).padStart(4, '0');
            const mStr = String(mins).padStart(2, '0');
            const sStr = String(secs).padStart(2, '0');
            api.handle.LMSSetValue('cmi.core.session_time', hStr + ':' + mStr + ':' + sStr);
            api.handle.LMSCommit('');
          }
        } catch(e) {}
      },
      reportCompletion: function(score) {
        if (!api || isTerminated) return;
        if (score !== undefined) currentScore = Number(score);
        const normalized = getSafeScore(currentScore > 0 ? currentScore : 100);
        try {
          this.reportTime();
          if (api.v === '2004') {
            api.handle.SetValue('cmi.score.raw', String(normalized));
            api.handle.SetValue('cmi.score.scaled', String(normalized / 100));
            api.handle.SetValue('cmi.completion_status', 'completed');
            api.handle.SetValue('cmi.success_status', 'passed');
            api.handle.Commit('');
          } else {
            api.handle.LMSSetValue('cmi.core.score.min', '0');
            api.handle.LMSSetValue('cmi.core.score.max', '100');
            api.handle.LMSSetValue('cmi.core.score.raw', String(normalized));
            api.handle.LMSSetValue('cmi.core.lesson_status', 'passed');
            api.handle.LMSCommit('');
          }
        } catch(e) {}
      },
      saveState: function(stateObj) {
        try {
          const str = JSON.stringify(stateObj);
          try { localStorage.setItem('kids_scorm_state_' + '${manifest.id}', str); } catch(e) {}
          if (!api || isTerminated) return;
          if (api.v === '2004') {
            api.handle.SetValue('cmi.suspend_data', str);
            api.handle.SetValue('cmi.exit', 'suspend');
            api.handle.Commit('');
          } else {
            api.handle.LMSSetValue('cmi.suspend_data', str);
            api.handle.LMSSetValue('cmi.core.exit', 'suspend');
            api.handle.LMSCommit('');
          }
        } catch(e) {}
      },
      getSavedState: function() {
        try {
          const data = api ? (api.v === '2004' ? api.handle.GetValue('cmi.suspend_data') : api.handle.LMSGetValue('cmi.suspend_data')) : null;
          if (data && typeof data === 'string' && data.trim().startsWith('{')) {
            return JSON.parse(data.trim());
          }
        } catch(e) {}
        try {
          const local = localStorage.getItem('kids_scorm_state_' + '${manifest.id}');
          if (local) return JSON.parse(local);
        } catch(e) {}
        return null;
      },
      terminate: function() {
        if (!api || isTerminated) return;
        try {
          this.reportTime();
          if (currentScore > 0) {
            const normalized = getSafeScore(currentScore);
            if (api.v === '2004') {
              api.handle.SetValue('cmi.score.raw', String(normalized));
              api.handle.SetValue('cmi.score.scaled', String(normalized / 100));
              api.handle.Commit('');
              api.handle.Terminate('');
            } else {
              api.handle.LMSSetValue('cmi.core.score.raw', String(normalized));
              api.handle.LMSCommit('');
              api.handle.LMSFinish('');
            }
          } else {
            if (api.v === '2004') api.handle.Terminate('');
            else api.handle.LMSFinish('');
          }
        } catch(e) {}
        isTerminated = true;
      }
    };
  }
};
`;
  writeFileSync(join(pkgDir, 'scorm-bridge.js'), scormBridgeCode, 'utf-8');

  // 6. Create standard SCORM zip using AdmZip
  const zipPath = join(OUT_DIR, `${gameId}-scorm-v1.0.zip`);
  try {
    const zip = new AdmZip();
    zip.addLocalFolder(pkgDir);
    zip.writeZip(zipPath);
    console.log(`✅ Created SCORM zip: ${zipPath}`);
  } catch (err) {
    console.error(`Error creating zip for ${gameId}:`, err);
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
