
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
