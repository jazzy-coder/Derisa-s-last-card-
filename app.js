/* Derisa's Last Card: shared helpers used by every page.
   Load order in each HTML file:
     1) supabase-js (CDN)   2) config.js   3) app.js
   Everything lives inside DLC so it never clashes with a page's own variables. */
(function () {
  var C = window.DLC_CONFIG || {};
  var A = {
    C: C,
    sb: null,
    CARD_BASE: C.SUPABASE_URL + '/storage/v1/object/public/cards/v1/',
    ASSET_BASE: C.SUPABASE_URL + '/storage/v1/object/public/game-assets/'
  };

  /* Where the login is remembered between pages.
     On a real website (https) normal browser storage is used.
     When the pages are opened from files on a phone (file://), the browser often does NOT share
     storage between pages, so the login is also kept in window.name, which survives moving to
     another page in the same tab. (Local testing only; it is switched off on https.) */
  var FILE = location.protocol === 'file:';
  function nameObj() {
    try { var n = window.name || ''; return n.indexOf('DLC:') === 0 ? JSON.parse(n.slice(4)) : {}; } catch (e) { return {}; }
  }
  function nameSave(o) { try { window.name = 'DLC:' + JSON.stringify(o); } catch (e) {} }
  var store = {
    getItem: function (k) {
      var v = null;
      if (FILE) { var o = nameObj(); v = o[k] == null ? null : o[k]; }
      if (v == null) { try { v = window.localStorage.getItem(k); } catch (e) {} }
      return v;
    },
    setItem: function (k, v) {
      try { window.localStorage.setItem(k, v); } catch (e) {}
      if (FILE) { var o = nameObj(); o[k] = v; nameSave(o); }
    },
    removeItem: function (k) {
      try { window.localStorage.removeItem(k); } catch (e) {}
      if (FILE) { var o = nameObj(); delete o[k]; nameSave(o); }
    }
  };
  A.store = store;

  if (window.supabase && C.SUPABASE_URL && C.SUPABASE_KEY) {
    A.sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storage: store }
    });
  }

  /* Current session, or null. */
  A.session = async function () {
    if (!A.sb) return null;
    try {
      var r = await A.sb.auth.getSession();
      return (r.data && r.data.session) || null;
    } catch (e) { console.error('getSession failed', e); return null; }
  };

  /* One-line status for debugging, e.g. "library ok, url ok". */
  A.status = function () {
    return 'library ' + (window.supabase ? 'ok' : 'MISSING') + ', config ' + (C.SUPABASE_URL ? 'ok' : 'MISSING') + ', client ' + (A.sb ? 'ok' : 'MISSING') + ', page ' + location.protocol + ', window.name fallback ' + (FILE ? 'on' : 'off');
  };

  /* Use at the top of a page that needs a signed-in player (guests count as signed in). */
  A.requireAuth = async function (to) {
    var s = await A.session();
    if (!s) { console.warn('No saved login found, going back to the login page.'); location.replace((to || 'Index.html') + '?nosession=1'); return null; }
    return s;
  };

  A.signOut = async function () {
    if (A.sb) await A.sb.auth.signOut();
    location.replace('Index.html');
  };

  /* Harder levels: level 2 at 100 XP, 3 at 400, 4 at 900, 5 at 1600 (same formula as the database). */
  A.levelInfo = function (xp) {
    xp = xp || 0;
    var L = 1 + Math.floor(Math.sqrt(xp / 100)), lo = 100 * (L - 1) * (L - 1), hi = 100 * L * L;
    return { level: L, pct: Math.max(0, Math.min(100, Math.round((xp - lo) * 100 / (hi - lo)))), toNext: hi - xp };
  };

  window.DLC = A;
})();
