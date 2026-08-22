
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
          try { localStorage.setItem('kids_scorm_state_' + 'memory-match', str); } catch(e) {}
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
          const local = localStorage.getItem('kids_scorm_state_' + 'memory-match');
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
