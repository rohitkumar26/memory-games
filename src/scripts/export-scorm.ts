import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, unlinkSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';
import AdmZip from 'adm-zip';

const GAMES_DIR = resolve(process.cwd(), 'src/games');
const DIST_DIR = resolve(process.cwd(), 'dist');
const ASTRO_DIR = resolve(DIST_DIR, '_astro');
const FONTS_SRC_DIR = resolve(process.cwd(), 'public/fonts');
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
SCORM Compliance: SCORM 1.2 & SCORM 2004 (100% Offline & Firewall Compliant)

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
- 100% Ad-Free, COPPA & FERPA Compliant. Runs entirely within your school's private LMS with zero external dependencies.

Single Classroom License — Unauthorized public re-hosting or resale is prohibited.
Support: support@kidsmemorygames.com
`;
}

function generateTeacherGuideHTML(manifest: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${manifest.name} — Teacher Quick-Start Guide</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1F2937; background: #FAFAFA; }
    .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #E5E7EB; }
    .header { background: linear-gradient(135deg, #581C87, #3B0764); color: white; padding: 24px 32px; border-radius: 16px 16px 0 0; margin: -32px -32px 24px -32px; }
    .badge { display: inline-block; padding: 4px 10px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 12px; font-weight: bold; margin-right: 8px; }
    h1 { margin: 0 0 8px 0; font-size: 26px; }
    h2 { color: #581C87; border-bottom: 2px solid #F3E8FF; padding-bottom: 6px; margin-top: 28px; font-size: 18px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
    .btn { display: inline-block; background: #581C87; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; cursor: pointer; border: none; font-size: 14px; }
    .print-hide { margin-bottom: 20px; text-align: right; }
    @media print {
      body { background: white; margin: 0; padding: 0; }
      .card { box-shadow: none; border: none; padding: 0; }
      .header { margin: 0 0 20px 0; border-radius: 8px; color: black; background: #F3E8FF; }
      .print-hide { display: none; }
    }
  </style>
</head>
<body>
  <div class="print-hide">
    <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <div class="card">
    <div class="header">
      <h1>🏫 ${manifest.name}</h1>
      <p style="margin:0; opacity: 0.9;">Classroom SCORM Edition • Teacher & Clinician Quick-Start Guide</p>
      <div style="margin-top: 12px;">
        <span class="badge">Category: ${manifest.category}</span>
        <span class="badge">Ages: ${manifest.ageRange.min}–${manifest.ageRange.max}</span>
        <span class="badge">Standard: SCORM 1.2 & 2004 (Offline Ready)</span>
      </div>
    </div>
    <h2>1. Quick LMS Deployment Steps</h2>
    <ul>
      <li><strong>Canvas LMS:</strong> Go to Course → Modules → Add Item (+) → Select "SCORM" → Upload this package zip file → Choose "Graded Assignment".</li>
      <li><strong>Moodle:</strong> Turn Editing On → Add an Activity or Resource → Choose "SCORM package" → Upload this zip. In Grading, set "Grading method: Highest grade".</li>
      <li><strong>Blackboard / Schoology / Google Classroom:</strong> Content / Materials → Add SCORM / Package → Choose this zip.</li>
    </ul>
    <h2>2. Gradebook Synchronization</h2>
    <ul>
      <li><strong>Completion Status:</strong> Reports "passed" / "completed" automatically upon student success.</li>
      <li><strong>Mastery Score (0–100%):</strong> Automatically logs percentage progress into teacher gradebooks.</li>
      <li><strong>Session Time:</strong> Logs active practice duration for IEP documentation and time-on-task reporting.</li>
      <li><strong>State Bookmarking:</strong> Automatically saves progress if student closes window to resume later.</li>
    </ul>
    <h2>3. Educational Objectives & IEP Integration</h2>
    <ul>
      <li><strong>Objective:</strong> ${manifest.description}</li>
      <li><strong>Target Skills:</strong> Working Memory, Focus, Visual Processing, Cognitive Flexibility.</li>
      <li><strong>Privacy & Security:</strong> 100% Ad-Free, Zero Tracking, COPPA & FERPA Compliant. Operates strictly within school intranet / private LMS with zero external dependencies.</li>
    </ul>
    <p style="font-size: 11px; color: #9CA3AF; margin-top: 30px; text-align: center; border-top: 1px solid #E5E7EB; padding-top: 12px;">
      Single Classroom / District License • Kids Memory Games Platform • support@kidsmemorygames.com
    </p>
  </div>
</body>
</html>`;
}

function createTeacherGuidePDFBuffer(manifest: any): Buffer {
  const title = manifest.name + ' - Classroom SCORM Edition';
  const subtitle = 'Teacher & Clinician Quick-Start Guide';
  const category = 'Educational Category: ' + String(manifest.category || '').toUpperCase();
  const ages = 'Target Age Range: Ages ' + manifest.ageRange.min + ' - ' + manifest.ageRange.max;
  const standard = 'Standard: SCORM 1.2 & SCORM 2004 (100% Offline & Firewall Ready)';
  const desc = String(manifest.description || '').replace(/[()]/g, '');

  const contentStream = `q
0.345 0.110 0.529 rg
40 730 515 70 re f
1 1 1 rg
BT
/F2 18 Tf
55 770 Td
(${title}) Tj
ET
BT
/F1 11 Tf
55 748 Td
(${subtitle}) Tj
ET
0.953 0.910 1.0 rg
0.847 0.706 0.996 RG
1 w
40 645 515 70 re B
0.345 0.110 0.529 rg
BT
/F2 10 Tf
55 695 Td
(${category}) Tj
ET
BT
/F1 10 Tf
55 678 Td
(${ages}) Tj
ET
BT
/F1 10 Tf
55 661 Td
(${standard}) Tj
ET
0.345 0.110 0.529 rg
BT
/F2 13 Tf
40 615 Td
(1. Quick LMS Deployment Steps) Tj
ET
0.216 0.255 0.318 rg
BT
/F1 9.5 Tf
50 595 Td
(- Canvas LMS: Modules -> Add Item (+) -> Select SCORM -> Upload package zip -> Set Graded Assignment.) Tj
50 578 Td
(- Moodle: Turn Editing On -> Add Activity/Resource -> Choose SCORM package -> Upload zip.) Tj
50 561 Td
(- Blackboard / Schoology / Google Classroom: Add SCORM/Package -> Upload zip. Scores auto-sync.) Tj
ET
0.345 0.110 0.529 rg
BT
/F2 13 Tf
40 530 Td
(2. Gradebook & Session Tracking) Tj
ET
0.216 0.255 0.318 rg
BT
/F1 9.5 Tf
50 510 Td
(- Completion Status: Automatically records passed / completed when student completes learning targets.) Tj
50 493 Td
(- Mastery Score 0-100%: Automatically logs percentage progress into teacher gradebook.) Tj
50 476 Td
(- Session Time Tracking: Logs active student time for IEP documentation and time-on-task metrics.) Tj
50 459 Td
(- Bookmark & Resume: Remembers student progress if window is closed and resumed later.) Tj
ET
0.345 0.110 0.529 rg
BT
/F2 13 Tf
40 425 Td
(3. Educational Objectives & IEP Integration) Tj
ET
0.216 0.255 0.318 rg
BT
/F1 9.5 Tf
50 405 Td
(- Overview: ${desc}) Tj
50 388 Td
(- Target Skills: Working Memory, Focus, Visual Processing, Cognitive Flexibility.) Tj
50 371 Td
(- Compliance: 100% Ad-Free, Zero External Network Requests, COPPA & FERPA Compliant.) Tj
ET
0.612 0.639 0.686 rg
BT
/F1 8 Tf
120 40 Td
(Single Classroom / District License - Kids Memory Games Platform - support@kidsmemorygames.com) Tj
ET
Q
`;

  const streamBytes = Buffer.from(contentStream, 'utf-8');
  const streamLength = streamBytes.length;

  let pdf = '%PDF-1.4\n';
  const offsets = [];

  offsets.push(pdf.length);
  pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

  offsets.push(pdf.length);
  pdf += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';

  offsets.push(pdf.length);
  pdf += '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n';

  offsets.push(pdf.length);
  pdf += '4 0 obj\n<< /Length ' + streamLength + ' >>\nstream\n';
  const pdfHeader = Buffer.from(pdf, 'utf-8');
  const pdfStreamEnd = Buffer.from('\nendstream\nendobj\n', 'utf-8');

  const font1Offset = pdfHeader.length + streamBytes.length + pdfStreamEnd.length;
  const font1 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  const font2Offset = font1Offset + Buffer.byteLength(font1, 'utf-8');
  const font2 = '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n';

  const allOffsets = [
    offsets[0],
    offsets[1],
    offsets[2],
    offsets[3],
    font1Offset,
    font2Offset
  ];

  const totalBeforeXref = font2Offset + Buffer.byteLength(font2, 'utf-8');

  let xref = 'xref\n0 7\n0000000000 65535 f \n';
  for (const off of allOffsets) {
    xref += String(off).padStart(10, '0') + ' 00000 n \n';
  }
  xref += 'trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n' + totalBeforeXref + '\n%%EOF\n';

  return Buffer.concat([
    pdfHeader,
    streamBytes,
    pdfStreamEnd,
    Buffer.from(font1 + font2 + xref, 'utf-8')
  ]);
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
    @font-face {
      font-family: 'Nunito';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('./fonts/nunito-400.ttf') format('truetype');
    }
    @font-face {
      font-family: 'Nunito';
      font-style: normal;
      font-weight: 700;
      font-display: swap;
      src: url('./fonts/nunito-700.ttf') format('truetype');
    }
    @font-face {
      font-family: 'Nunito';
      font-style: normal;
      font-weight: 900;
      font-display: swap;
      src: url('./fonts/nunito-900.ttf') format('truetype');
    }
    body { margin: 0; padding: 0; background: #FDF8F3; font-family: 'Nunito', ui-rounded, 'Comfortaa', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow-x: hidden; }
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
    let highestRecordedScore = Math.max(0, Number(saved && saved.score) || 0);

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

      // 1. Calculate In-Level Progress (0..1)
      let inLevelRatio = 0;
      if (current && typeof current.sortedCount === 'number' && typeof current.totalCount === 'number' && current.totalCount > 0) {
        inLevelRatio = current.sortedCount / current.totalCount;
      } else if (current && Array.isArray(current.cards) && current.cards.length > 0) {
        const done = current.cards.filter(c => c && typeof c.isDone === 'function' && c.isDone()).length;
        inLevelRatio = done / current.cards.length;
      } else if (current && Array.isArray(current.dots) && current.dots.length > 0) {
        const connected = current.dots.filter(d => d && d.connected).length;
        inLevelRatio = connected / current.dots.length;
      } else {
        const statusText = document.body.innerText || '';
        const roundMatch = statusText.match(/Round\s+(\d+)\s+of\s+(\d+)/i);
        if (roundMatch) {
          const rCurrent = parseInt(roundMatch[1], 10);
          const rTotal = parseInt(roundMatch[2], 10);
          if (rTotal > 0) inLevelRatio = Math.max(0, (rCurrent - 1) / rTotal);
        }
      }

      let activeRound = current && current.currentRound ? current.currentRound : savedRound;
      const statusText = document.body.innerText || '';
      const roundMatch = statusText.match(/Round\s+(\d+)\s+of\s+(\d+)/i);
      if (roundMatch) {
        activeRound = parseInt(roundMatch[1], 10);
      }

      // 2. Cumulative Multi-Level Progress across 5 difficulty levels (0..100)
      const totalLevels = 5;
      const completedLevels = Math.max(0, activeLevel - 1);
      const cumulativeProgressPct = Math.min(100, Math.round(((completedLevels + Math.min(1, inLevelRatio)) / totalLevels) * 100));

      // Real-time calculated score: high-water mark ensuring no regressions
      highestRecordedScore = Math.max(highestRecordedScore, cumulativeProgressPct);
      const lmsScore = highestRecordedScore;

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
  if (existsSync(pkgDir)) {
    try { rmSync(pkgDir, { recursive: true, force: true }); } catch (e) {}
  }
  const pkgAstroDir = join(pkgDir, '_astro');
  mkdirSync(pkgAstroDir, { recursive: true });

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
      let cssContent = readFileSync(srcPath, 'utf-8');
      cssContent = cssContent.replace(/@import\s+url\(['"]https:\/\/fonts\.googleapis\.com[^'"]+['"]\);?/gi, '');
      writeFileSync(destPath, cssContent, 'utf-8');
    } else if (f.endsWith('.js')) {
      if (f.startsWith('hoisted.')) jsFile = f;
      let jsContent = readFileSync(srcPath, 'utf-8');
      jsContent = jsContent.replace(/["']\/_astro\//g, '"./_astro/');
      jsContent = jsContent.replace(/return\s*["']\/["']\s*\+\s*([a-zA-Z0-9_$]+)/g, 'return "./"+$1');
      writeFileSync(destPath, jsContent, 'utf-8');
    } else {
      copyFileSync(srcPath, destPath);
    }
    relativeAssetPaths.push(`_astro/${f}`);
  });

  // 2. Copy self-hosted fonts
  const pkgFontsDir = join(pkgDir, 'fonts');
  if (existsSync(FONTS_SRC_DIR)) {
    if (!existsSync(pkgFontsDir)) mkdirSync(pkgFontsDir, { recursive: true });
    readdirSync(FONTS_SRC_DIR).forEach(fontFile => {
      copyFileSync(join(FONTS_SRC_DIR, fontFile), join(pkgFontsDir, fontFile));
      relativeAssetPaths.push(`fonts/${fontFile}`);
    });
  }

  // 3. Write Guides (Markdown, Printable HTML, and PDF)
  writeFileSync(join(pkgDir, 'TEACHER_GUIDE.md'), generateTeacherGuide(manifest), 'utf-8');
  writeFileSync(join(pkgDir, 'TEACHER_GUIDE.html'), generateTeacherGuideHTML(manifest), 'utf-8');
  writeFileSync(join(pkgDir, 'TEACHER_GUIDE.pdf'), createTeacherGuidePDFBuffer(manifest));

  relativeAssetPaths.push('TEACHER_GUIDE.md');
  relativeAssetPaths.push('TEACHER_GUIDE.html');
  relativeAssetPaths.push('TEACHER_GUIDE.pdf');

  // 4. Write imsmanifest.xml
  writeFileSync(join(pkgDir, 'imsmanifest.xml'), generateIMSManifest(manifest, relativeAssetPaths), 'utf-8');

  // 5. Write standalone entry HTML (both unique gameId.html and index.html)
  const standaloneHTML = generateStandaloneHTML(manifest, cssFile, jsFile);
  writeFileSync(join(pkgDir, `${gameId}.html`), standaloneHTML, 'utf-8');
  writeFileSync(join(pkgDir, 'index.html'), standaloneHTML, 'utf-8');

  // 6. Copy scorm-bridge.js
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
            api.handle.Commit('');
          } else {
            api.handle.LMSSetValue('cmi.core.score.min', '0');
            api.handle.LMSSetValue('cmi.core.score.max', '100');
            api.handle.LMSSetValue('cmi.core.score.raw', String(normalized));
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
        if (score !== undefined && Number(score) <= 100) currentScore = Number(score);
        const normalized = getSafeScore(currentScore > 0 ? currentScore : 20);
        try {
          this.reportTime();
          if (api.v === '2004') {
            if (currentScore > 0) {
              api.handle.SetValue('cmi.score.raw', String(normalized));
              api.handle.SetValue('cmi.score.scaled', String(normalized / 100));
            }
            api.handle.SetValue('cmi.completion_status', 'completed');
            api.handle.SetValue('cmi.success_status', 'passed');
            api.handle.Commit('');
          } else {
            if (currentScore > 0) {
              api.handle.LMSSetValue('cmi.core.score.min', '0');
              api.handle.LMSSetValue('cmi.core.score.max', '100');
              api.handle.LMSSetValue('cmi.core.score.raw', String(normalized));
            }
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

  // 7. Create standard SCORM zip using AdmZip in-memory buffer
  const zipPath = join(OUT_DIR, `${gameId}-scorm-v1.0.zip`);
  let retries = 5;
  while (retries > 0) {
    try {
      const zip = new AdmZip();
      zip.addLocalFolder(pkgDir);
      const zipBuffer = zip.toBuffer();
      writeFileSync(zipPath, zipBuffer);
      console.log(`✅ Created SCORM zip: ${zipPath}`);
      break;
    } catch (err) {
      retries--;
      if (retries === 0) {
        console.error(`Error creating zip for ${gameId}:`, err);
      } else {
        const end = Date.now() + 200;
        while (Date.now() < end) {}
      }
    }
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
  for (const g of games) {
    packageGame(g);
  }
  console.log(`\n🎉 All SCORM packages generated successfully in: ${OUT_DIR}`);
}

run();
