// ============================================================================
// SCORM 1.2 & 2004 Lightweight Universal Bridge API
// Allows kids memory games to seamlessly report scores, completion, and time
// to Canvas, Moodle, Blackboard, Schoology, Brightspace, and SCORM Cloud.
// ============================================================================

export interface SCORMScoreReport {
  score: number;
  maxScore?: number;
  minScore?: number;
  timeInSeconds: number;
  success: boolean;
}

export class SCORMBridge {
  private static instance: SCORMBridge | null = null;
  private apiHandle: any = null;
  private scormVersion: '1.2' | '2004' | null = null;
  private isInitialized = false;
  private startTime: number = Date.now();

  private constructor() {
    this.findAPI();
  }

  public static getInstance(): SCORMBridge {
    if (!SCORMBridge.instance) {
      SCORMBridge.instance = new SCORMBridge();
    }
    return SCORMBridge.instance;
  }

  /**
   * Searches for the SCORM API object in window or parent frames (SCORM standard).
   */
  private findAPI(): void {
    if (typeof window === 'undefined') return;

    let currentWindow: any = window;
    let findAttempts = 0;
    const maxAttempts = 10;

    while (currentWindow && findAttempts < maxAttempts) {
      // Check for SCORM 2004
      if (currentWindow.API_1484_11) {
        this.apiHandle = currentWindow.API_1484_11;
        this.scormVersion = '2004';
        break;
      }
      // Check for SCORM 1.2
      if (currentWindow.API) {
        this.apiHandle = currentWindow.API;
        this.scormVersion = '1.2';
        break;
      }

      if (currentWindow.parent && currentWindow.parent !== currentWindow) {
        currentWindow = currentWindow.parent;
      } else if (currentWindow.opener) {
        currentWindow = currentWindow.opener;
      } else {
        break;
      }
      findAttempts++;
    }
  }

  /**
   * Returns true if running inside an active LMS (Canvas, Moodle, etc.)
   */
  public isLMSActive(): boolean {
    return this.apiHandle !== null;
  }

  /**
   * Initializes the SCORM LMS session.
   */
  public initialize(): boolean {
    if (!this.apiHandle || this.isInitialized) return this.isInitialized;

    let result = 'false';
    try {
      if (this.scormVersion === '2004') {
        result = this.apiHandle.Initialize('');
      } else if (this.scormVersion === '1.2') {
        result = this.apiHandle.LMSInitialize('');
      }
      this.isInitialized = result === 'true';
      this.startTime = Date.now();
      if (this.isInitialized) {
        this.setValue('cmi.core.lesson_status', 'incomplete');
        this.commit();
      }
    } catch (e) {
      console.warn('SCORM initialization warning:', e);
    }
    return this.isInitialized;
  }

  /**
   * Sets a CMI data value in the LMS.
   */
  public setValue(element: string, value: string | number): boolean {
    if (!this.apiHandle || !this.isInitialized) return false;

    try {
      const valStr = String(value);
      if (this.scormVersion === '2004') {
        // Map common 1.2 elements to 2004 if needed
        let el = element;
        if (el === 'cmi.core.lesson_status') el = 'cmi.completion_status';
        if (el === 'cmi.core.score.raw') el = 'cmi.score.raw';
        if (el === 'cmi.core.session_time') el = 'cmi.session_time';
        return this.apiHandle.SetValue(el, valStr) === 'true';
      } else {
        return this.apiHandle.LMSSetValue(element, valStr) === 'true';
      }
    } catch (e) {
      return false;
    }
  }

  /**
   * Commits current data to LMS persistence.
   */
  public commit(): boolean {
    if (!this.apiHandle || !this.isInitialized) return false;
    try {
      if (this.scormVersion === '2004') {
        return this.apiHandle.Commit('') === 'true';
      } else {
        return this.apiHandle.LMSCommit('') === 'true';
      }
    } catch (e) {
      return false;
    }
  }

  /**
   * Reports final score and completes the SCORM lesson in teacher gradebook.
   */
  public reportCompletion(report: SCORMScoreReport): void {
    if (!this.apiHandle || !this.isInitialized) return;

    const status = report.success ? 'passed' : 'completed';
    const durationSec = report.timeInSeconds || Math.floor((Date.now() - this.startTime) / 1000);
    const formattedTime = this.formatSCORMTime(durationSec);

    if (this.scormVersion === '2004') {
      this.setValue('cmi.completion_status', 'completed');
      this.setValue('cmi.success_status', report.success ? 'passed' : 'failed');
      this.setValue('cmi.score.raw', report.score);
      if (report.maxScore) this.setValue('cmi.score.max', report.maxScore);
      if (report.minScore !== undefined) this.setValue('cmi.score.min', report.minScore);
      this.setValue('cmi.session_time', formattedTime);
    } else {
      this.setValue('cmi.core.lesson_status', status);
      this.setValue('cmi.core.score.raw', report.score);
      if (report.maxScore) this.setValue('cmi.core.score.max', report.maxScore);
      if (report.minScore !== undefined) this.setValue('cmi.core.score.min', report.minScore);
      this.setValue('cmi.core.session_time', formattedTime);
    }

    this.commit();
  }

  /**
   * Terminates LMS connection on game exit.
   */
  public terminate(): void {
    if (!this.apiHandle || !this.isInitialized) return;
    try {
      if (this.scormVersion === '2004') {
        this.apiHandle.Terminate('');
      } else {
        this.apiHandle.LMSFinish('');
      }
      this.isInitialized = false;
    } catch (e) {
      console.warn('SCORM termination warning:', e);
    }
  }

  private formatSCORMTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (this.scormVersion === '2004') {
      // ISO 8601 duration format: PT0H0M0S
      return `PT${hrs}H${mins}M${secs}S`;
    } else {
      // SCORM 1.2 format: HHHH:MM:SS
      const h = String(hrs).padStart(4, '0');
      const m = String(mins).padStart(2, '0');
      const s = String(secs).padStart(2, '0');
      return `${h}:${m}:${s}`;
    }
  }
}

/**
 * Displays a kid-friendly educator upsell modal when a player clicks locked levels (4 or 5) on the free website.
 */
export function showSCORMLockModal(api: any, level: number): void {
  if (typeof document === 'undefined') return;

  const overlay = api.createElement('div', [
    'fixed', 'inset-0', 'bg-black/50', 'backdrop-blur-sm',
    'flex', 'items-center', 'justify-center', 'z-50', 'p-4'
  ]);

  const modal = api.createElement('div', [
    'bg-white', 'rounded-3xl', 'p-6', 'sm:p-8', 'max-w-md', 'w-full', 'text-center',
    'shadow-2xl', 'border-4', 'border-purple-200', 'animate-pop'
  ]);

  modal.innerHTML = `
    <div class="text-5xl mb-3 animate-bounce-slow">🔒</div>
    <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-bold text-xs uppercase tracking-wider inline-block mb-2">
      Level ${level} • Classroom SCORM Edition
    </span>
    <h3 class="text-2xl font-black text-gray-900 mb-2">Unlocked in SCORM</h3>
    <p class="text-gray-600 text-sm mb-6 leading-relaxed">
      Levels 4 & 5 (Expert & Master) are unlocked in the official <strong>Classroom SCORM Package</strong> for Canvas, Moodle, and Schoology with auto-gradebook sync!
    </p>
    <div class="flex flex-col gap-2.5">
      <a href="/for-teachers" class="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all text-center">
        🎓 Explore Classroom SCORM Packages →
      </a>
      <button id="close-lock-modal" class="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-2xl transition cursor-pointer">
        Keep Playing Free Levels 1–3
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeBtn = modal.querySelector('#close-lock-modal');
  closeBtn?.addEventListener('click', () => {
    overlay.remove();
  });
  overlay.addEventListener('click', (e: MouseEvent) => {
    if (e.target === overlay) overlay.remove();
  });
}

