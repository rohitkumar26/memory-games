
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

    let currentScore = 0;
    let startTime = Date.now();

    return {
      initialize: function() {
        if (!api) return false;
        const res = api.v === '2004' ? api.handle.Initialize('') === 'true' : api.handle.LMSInitialize('') === 'true';
        if (res) {
          if (api.v === '2004') {
            api.handle.SetValue('cmi.completion_status', 'incomplete');
            api.handle.SetValue('cmi.score.min', '0');
            api.handle.SetValue('cmi.score.max', '1000');
            api.handle.Commit('');
          } else {
            api.handle.LMSSetValue('cmi.core.lesson_status', 'incomplete');
            api.handle.LMSSetValue('cmi.core.score.min', '0');
            api.handle.LMSSetValue('cmi.core.score.max', '1000');
            api.handle.LMSCommit('');
          }
        }
        return res;
      },
      reportScore: function(score) {
        if (!api) return;
        currentScore = Number(score) || 0;
        if (api.v === '2004') {
          api.handle.SetValue('cmi.score.raw', String(currentScore));
          api.handle.SetValue('cmi.score.scaled', String(Math.min(1, currentScore / 500)));
          api.handle.Commit('');
        } else {
          api.handle.LMSSetValue('cmi.core.score.raw', String(currentScore));
          api.handle.LMSCommit('');
        }
      },
      reportTime: function(seconds) {
        if (!api) return;
        const s = Number(seconds) || Math.floor((Date.now() - startTime) / 1000);
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
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
      },
      reportCompletion: function(score) {
        if (!api) return;
        if (score !== undefined) currentScore = Number(score);
        this.reportScore(currentScore);
        this.reportTime();
        if (api.v === '2004') {
          api.handle.SetValue('cmi.completion_status', 'completed');
          api.handle.SetValue('cmi.success_status', 'passed');
          api.handle.Commit('');
        } else {
          api.handle.LMSSetValue('cmi.core.lesson_status', 'passed');
          api.handle.LMSCommit('');
        }
      },
      terminate: function() {
        if (!api) return;
        this.reportTime();
        if (currentScore > 0) this.reportScore(currentScore);
        if (api.v === '2004') api.handle.Terminate('');
        else api.handle.LMSFinish('');
      }
    };
  }
};
