/* Local persistence. Everything the player does stays on their device —
   no account, no server, which is what the dossiers promise on the gate card. */
(function (global) {
  'use strict';

  var KEY = 'verdict60.v1';

  function blank() {
    return { lang: null, view: null, followed: false, cases: {} };
  }

  var memory = null;          // fallback when localStorage is unavailable
  var usable = (function () {
    try {
      var probe = '__v60__';
      global.localStorage.setItem(probe, '1');
      global.localStorage.removeItem(probe);
      return true;
    } catch (e) {
      // Safari private mode, or a browser with storage disabled. The site has
      // to keep working; progress just will not survive a reload.
      return false;
    }
  })();

  function read() {
    if (!usable) return memory || (memory = blank());
    try {
      var raw = global.localStorage.getItem(KEY);
      if (!raw) return blank();
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return blank();
      parsed.cases = parsed.cases || {};
      return parsed;
    } catch (e) {
      return blank();
    }
  }

  function write(state) {
    if (!usable) { memory = state; return; }
    try {
      global.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* quota or disabled mid-session — ignore, the UI is still correct */
    }
  }

  function caseState(state, id) {
    if (!state.cases[id]) state.cases[id] = { seen: [0], notes: '', accused: null, correct: null };
    var c = state.cases[id];
    if (!Array.isArray(c.seen) || !c.seen.length) c.seen = [0];
    if (typeof c.notes !== 'string') c.notes = '';
    if (c.correct === undefined) c.correct = null;   // files answered before rank existed
    return c;
  }

  var Store = {
    available: usable,

    getLang: function () { return read().lang; },
    setLang: function (lang) { var s = read(); s.lang = lang; write(s); },

    /* 'auto' follows the device; 'desktop' is a phone asking for the wide
       layout. Null means never chosen, which behaves as 'auto'. */
    getView: function () { return read().view === 'desktop' ? 'desktop' : 'auto'; },
    setView: function (view) { var s = read(); s.view = view; write(s); },

    hasFollowed: function () { return read().followed === true; },
    setFollowed: function () { var s = read(); s.followed = true; write(s); },

    getCase: function (id) {
      var s = read();
      var c = caseState(s, id);
      return { seen: c.seen.slice(), notes: c.notes, accused: c.accused, correct: c.correct };
    },

    markSeen: function (id, index) {
      var s = read();
      var c = caseState(s, id);
      if (c.seen.indexOf(index) === -1) { c.seen.push(index); write(s); }
    },

    setNotes: function (id, text) {
      var s = read();
      caseState(s, id).notes = text;
      write(s);
    },

    /* `correct` is passed in because only the case file knows the culprit;
       storing it here is what lets the index and the rank read a result
       without loading every case JSON. */
    setAccused: function (id, index, correct) {
      var s = read();
      var c = caseState(s, id);
      c.accused = index;
      c.correct = (index === null || index === undefined) ? null : correct === true;
      write(s);
    },

    /* Cases solved across the whole device — the rank is built on this. */
    stats: function () {
      var s = read(), solved = 0, played = 0;
      Object.keys(s.cases).forEach(function (id) {
        var c = s.cases[id];
        if (c.accused === null || c.accused === undefined) return;
        played++;
        if (c.correct === true) solved++;
      });
      return { solved: solved, played: played };
    },

    resetCase: function (id) {
      var s = read();
      delete s.cases[id];
      write(s);
    }
  };

  global.Store = Store;
})(window);
