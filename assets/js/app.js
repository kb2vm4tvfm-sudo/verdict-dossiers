/* Verdict60 dossiers — hash-routed static app.
 *
 * Routes:
 *   #/                     dossier index
 *   #/how                  how it works
 *   #/case/<id>            case landing (+ follow gate)
 *   #/case/<id>/<num>      one document inside the file, e.g. #/case/184/03
 *   #/case/<id>/accuse     name a suspect
 *
 * Deep links matter here: a post links straight to its own dossier, so every
 * screen has to be reachable by URL and survive a reload.
 */
(function (global) {
  'use strict';

  var CONFIG = {
    manifest: 'data/manifest.json',
    instagram: 'https://instagram.com/verdictin60',
    gateEnabled: true,        // ask for a follow before the first file opens
    progressiveUnlock: true   // documents release as earlier ones are read
  };

  var I18N = global.I18N, Store = global.Store;
  var lang = I18N.detect();
  var manifest = null;
  var caseCache = {};
  var filter = 'all';
  var main = document.getElementById('main');

  function t(key) { return (I18N.copy[lang] && I18N.copy[lang][key]) || I18N.copy.en[key] || ''; }
  function L(value) { return I18N.pick(value, lang); }

  /* ── DOM builder ──────────────────────────────────────────────────────── */

  function h(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'text') { node.textContent = v; }
        else if (k === 'html') { node.appendChild(v); }
        else if (k === 'onClick') { node.addEventListener('click', v); }
        else if (k === 'onInput') { node.addEventListener('input', v); }
        else if (k === 'style') { node.setAttribute('style', v); }
        else { node.setAttribute(k, v === true ? '' : v); }
      });
    }
    (kids || []).forEach(function (kid) {
      if (kid == null || kid === false) return;
      node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    });
    return node;
  }

  function frag(kids) {
    var f = document.createDocumentFragment();
    (kids || []).forEach(function (k) { if (k) f.appendChild(k); });
    return f;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  /* An image when the case supplies one, the design's dashed placeholder when
     it does not — so a dossier can be published before its artwork exists.
     A path that is set but not yet uploaded falls back to the placeholder too,
     rather than leaving a broken-image icon in the middle of the file. */
  function media(src, alt, slotKey, extraClass) {
    if (!src) return placeholder(slotKey, extraClass);

    var wrap = h('div', { 'class': extraClass || '' });
    var img = h('img', { src: src, alt: alt || '', loading: 'lazy' });
    img.addEventListener('error', function () {
      var fallback = placeholder(slotKey, extraClass);
      if (wrap.parentNode) wrap.parentNode.replaceChild(fallback, wrap);
    });
    wrap.appendChild(img);
    return wrap;
  }

  function placeholder(slotKey, extraClass) {
    return h('div', { 'class': ('hatch ' + (extraClass || '')).trim() }, [
      h('div', { 'class': 'slot', text: t(slotKey) })
    ]);
  }

  /* ── Data ─────────────────────────────────────────────────────────────── */

  function loadManifest() {
    if (manifest) return Promise.resolve(manifest);
    return fetch(CONFIG.manifest, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        manifest = data;
        if (data.instagram) CONFIG.instagram = data.instagram;
        return manifest;
      });
  }

  function entryFor(id) {
    if (!manifest) return null;
    for (var i = 0; i < manifest.cases.length; i++) {
      if (String(manifest.cases[i].id) === String(id)) return manifest.cases[i];
    }
    return null;
  }

  function loadCase(id) {
    var entry = entryFor(id);
    if (!entry) return Promise.reject(new Error('unknown-case'));
    if (caseCache[id]) return Promise.resolve(caseCache[id]);
    return fetch(entry.path, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (detail) {
        var merged = Object.assign({}, detail, { entry: entry, id: String(id) });
        merged.pieces = merged.pieces || [];
        merged.suspects = merged.suspects || [];
        caseCache[id] = merged;
        return merged;
      });
  }

  /* ── Progress ─────────────────────────────────────────────────────────── */

  function unlockedCount(kase, seen) {
    if (!CONFIG.progressiveUnlock) return kase.pieces.length;
    return Math.min(kase.pieces.length, 3 + seen.length - 1);
  }

  function pieceIndexFromParam(kase, param) {
    for (var i = 0; i < kase.pieces.length; i++) {
      if (String(kase.pieces[i].num) === String(param)) return i;
    }
    var n = parseInt(param, 10);
    return isNaN(n) ? 0 : Math.max(0, Math.min(kase.pieces.length - 1, n));
  }

  /* ── View mode ────────────────────────────────────────────────────────── */

  /* A phone can ask for the wide layout the same way a browser's own "Request
     desktop site" does it: widen the viewport and let the existing media
     queries do the rest. Desktop browsers ignore the viewport tag entirely, so
     the control is only offered where pressing it would change something. */

  var VIEWPORT = {
    auto: 'width=device-width, initial-scale=1, viewport-fit=cover',
    desktop: 'width=1280'
  };

  function canSwitchView() {
    return !!(global.matchMedia && global.matchMedia('(pointer: coarse)').matches);
  }

  function applyView() {
    var tag = document.querySelector('meta[name="viewport"]');
    if (tag) tag.setAttribute('content', VIEWPORT[Store.getView()] || VIEWPORT.auto);
  }

  /* ── Chrome ───────────────────────────────────────────────────────────── */

  function paintChrome(route) {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (node) {
      node.textContent = t(node.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.classList.toggle('on', btn.getAttribute('data-lang') === lang);
    });
    document.querySelectorAll('[data-route]').forEach(function (link) {
      link.classList.toggle('on', link.getAttribute('data-route') === route);
    });

    var vs = document.querySelector('[data-viewswitch]');
    if (vs) {
      var wide = Store.getView() === 'desktop';
      vs.hidden = !canSwitchView();
      vs.classList.toggle('on', wide);
      // The label names the layout you would move to, not the one you are in.
      vs.textContent = t(wide ? 'viewMobile' : 'viewDesktop');
      vs.setAttribute('aria-label', t(wide ? 'viewMobileAria' : 'viewDesktopAria'));
    }
  }

  /* ── Screen: index ────────────────────────────────────────────────────── */

  /* ── Rank ─────────────────────────────────────────────────────────────── */

  function rankFor(solved) {
    var ranks = I18N.ranks, current = ranks[0], next = null;
    for (var i = 0; i < ranks.length; i++) {
      if (solved >= ranks[i].at) current = ranks[i];
      else { next = ranks[i]; break; }
    }
    return { current: current, next: next };
  }

  function renderRank() {
    var stats = Store.stats();
    // A first-time visitor gets the clean hero; the ladder only appears once
    // there is something on it.
    if (!stats.played) return null;

    var rank = rankFor(stats.solved);
    var from = rank.current.at;
    var span = rank.next ? rank.next.at - from : 0;
    var pct = rank.next ? Math.max(0, Math.min(1, (stats.solved - from) / span)) : 1;
    var remaining = rank.next ? rank.next.at - stats.solved : 0;

    return h('div', { 'class': 'rankstrip' }, [
      h('div', { 'class': 'rank-id' }, [
        h('div', { 'class': 'label', text: t('rankLabel') }),
        h('div', { 'class': 'rank-name', text: I18N.pick(rank.current.name, lang) })
      ]),
      h('div', { 'class': 'rank-count', text:
        String(stats.solved) + ' ' + t(stats.solved === 1 ? 'rankSolvedOne' : 'rankSolvedMany') }),
      h('div', { 'class': 'rank-track' }, [
        h('div', { 'class': 'rank-fill', style: 'width:' + (pct * 100).toFixed(1) + '%' })
      ]),
      h('div', { 'class': 'rank-next', text: rank.next
        ? String(remaining) + ' ' + t('rankNext').replace('%s', I18N.pick(rank.next.name, lang))
        : t('rankTop') })
    ]);
  }

  function badgeText(badge) { return I18N.pick(I18N.badges[badge] || badge, lang); }
  function badgeColor(badge) {
    if (badge === 'real') return 'var(--crimson)';
    if (badge === 'new') return 'var(--ink)';
    return 'rgba(234,233,228,.55)';
  }

  function renderIndex() {
    var cases = manifest.cases;
    var visible = cases.filter(function (c) {
      if (filter === 'all') return true;
      if (filter === 'new') return c.badge === 'new';
      return c.badge === filter;
    });

    var docCount = cases.length ? (cases[0].documents || 7) : 7;
    var facts = [
      [String(cases.length), t('factDossiers')],
      [manifest.runtime || '45–90 min', t('factRuntime')],
      [String(docCount), t('factDocuments')]
    ];

    var hero = h('section', { 'class': 'index-hero' }, [
      h('div', {}, [
        h('div', { 'class': 'eyebrow', text: t('indexEyebrow') }),
        h('h1', { text: t('indexTitle') }),
        h('p', { text: t('indexIntro') })
      ]),
      h('div', { 'class': 'facts' }, facts.map(function (f) {
        return h('div', {}, [
          h('div', { 'class': 'fact-value', text: f[0] }),
          h('div', { 'class': 'label', text: f[1] })
        ]);
      }))
    ]);

    var filterDefs = [
      ['all', t('filterAll')], ['real', t('filterReal')],
      ['constructed', t('filterConstructed')], ['new', t('filterNew')]
    ];
    var bar = h('div', { 'class': 'filterbar' }, [
      h('div', { 'class': 'label', text: t('allFiles') }),
      h('div', { 'class': 'filters' }, filterDefs.map(function (f) {
        return h('button', {
          type: 'button', 'class': filter === f[0] ? 'on' : '', text: f[1],
          'aria-pressed': filter === f[0] ? 'true' : 'false',
          onClick: function () { filter = f[0]; render(); }
        });
      }))
    ]);

    var grid = h('div', { 'class': 'grid-cases' },
      visible.length
        ? visible.map(cardFor)
        : [h('div', { 'class': 'empty', text: t('noMatches') })]
    );

    return h('div', { 'class': 'wrap rise' }, [hero, renderRank(), bar, grid]);
  }

  function cardFor(c) {
    var state = Store.getCase(c.id);
    var started = state.seen.length > 1 || state.accused !== null;
    var solved = state.correct === true;

    return h('a', { 'class': 'case-card', href: '#/case/' + c.id }, [
      h('div', { 'class': 'case-cover' }, [
        media(c.cover, L(c.title), 'coverSlot', 'cover-fill'),
        h('div', {
          'class': 'case-badge',
          style: 'color:' + badgeColor(c.badge),
          text: badgeText(c.badge)
        })
      ]),
      h('div', { style: 'display:flex;flex-direction:column;gap:9px' }, [
        h('div', { 'class': 'case-file', text: L(c.file) }),
        h('div', { 'class': 'case-title', text: L(c.title) }),
        h('div', { 'class': 'case-tagline', text: L(c.tagline) })
      ]),
      h('div', { 'class': 'case-foot' }, [
        h('span', { text: L(c.meta) }),
        started
          ? h('span', { 'class': 'case-progress', text: solved ? t('solved') : t('inProgress') })
          : h('span', {
              style: 'color:' + (String(c.level) === '3' ? 'var(--crimson)' : 'var(--dim-3)'),
              text: L(I18N.level) + ' ' + c.level
            })
      ])
    ]);
  }

  /* ── Screen: case detail ──────────────────────────────────────────────── */

  function renderDetail(kase) {
    var c = kase.entry;
    var state = Store.getCase(kase.id);
    var started = state.seen.length > 1 || state.accused !== null;
    var firstNum = kase.pieces.length ? kase.pieces[0].num : '01';
    var openHref = '#/case/' + kase.id + '/' + firstNum;

    var inside = h('div', {}, [
      h('div', { 'class': 'label', style: 'margin-bottom:18px', text: t('whatsInside') }),
      h('div', { 'class': 'pieces-grid' }, kase.pieces.map(function (p) {
        return h('div', { 'class': 'piece-cell' }, [
          h('div', { 'class': 'piece-cell-head' }, [
            h('span', { 'class': 'piece-cell-num', text: p.num }),
            h('span', { style: 'font-size:15px', text: L(p.label) })
          ]),
          h('div', { 'class': 'piece-cell-desc', text: L(p.desc) })
        ]);
      }))
    ]);

    var left = h('div', {}, [
      media(kase.keyArt, L(c.title), 'keyArtSlot', 'keyart hatch'),
      h('div', { 'class': 'eyebrow', text: L(c.file) + ' · ' + badgeText(c.badge) }),
      h('h1', { text: L(c.title) }),
      h('p', { 'class': 'synopsis', text: L(kase.synopsis) }),
      inside
    ]);

    var gateNeeded = CONFIG.gateEnabled && !Store.hasFollowed();
    var rail = h('div', { 'class': 'rail' }, [
      gateNeeded
        ? h('div', { 'class': 'gate' }, [
            h('div', { 'class': 'label', style: 'color:var(--crimson)', text: t('gateEyebrow') }),
            h('h2', { text: t('gateTitle') }),
            h('p', { text: t('gateBody') }),
            h('div', { 'class': 'gate-actions' }, [
              h('a', {
                'class': 'btn btn-outline', href: CONFIG.instagram,
                target: '_blank', rel: 'noopener noreferrer', text: t('gateFollow')
              }),
              h('button', {
                type: 'button', 'class': 'btn btn-solid', text: t('gateOpen'),
                onClick: function () { Store.setFollowed(); go(openHref); }
              })
            ]),
            h('div', { 'class': 'gate-note', text: t('gateNote') })
          ])
        : h('a', { 'class': 'btn btn-solid', href: openHref, text: started ? t('resume') : t('openFile') }),

      h('div', { 'class': 'metabox' }, (kase.detailMeta || []).map(function (m) {
        return h('div', { 'class': 'metarow' }, [
          h('span', { 'class': 'label', text: L(m.label) }),
          h('span', { 'class': 'val', text: L(m.value) })
        ]);
      }))
    ]);

    return h('div', { 'class': 'wrap rise' }, [
      h('a', { 'class': 'backlink', href: '#/', text: t('back') }),
      h('div', { 'class': 'detail' }, [left, rail])
    ]);
  }

  /* ── Screen: dossier workspace ────────────────────────────────────────── */

  function renderDossier(kase, param) {
    var accusing = param === 'accuse';
    var state = Store.getCase(kase.id);
    var index = accusing ? -1 : pieceIndexFromParam(kase, param);
    var unlocked = unlockedCount(kase, state.seen);

    if (!accusing && index < unlocked) {
      Store.markSeen(kase.id, index);
      state = Store.getCase(kase.id);
      unlocked = unlockedCount(kase, state.seen);
    }

    var progress = Math.round((state.seen.length / Math.max(1, kase.pieces.length)) * 100);

    var nav = h('div', { 'class': 'piece-nav', role: 'tablist' }, kase.pieces.map(function (p, i) {
      var isOpen = i < unlocked;
      var done = state.seen.indexOf(i) !== -1;
      var tag = !isOpen ? t('tagSealed') : (done ? t('tagRead') : t('tagOpen'));
      var tagClass = !isOpen ? 'tag-sealed' : (done ? 'tag-read' : 'tag-open');
      return h('a', {
        'class': 'piece-nav-item' + (!accusing && i === index ? ' on' : '') + (isOpen ? '' : ' sealed'),
        href: '#/case/' + kase.id + '/' + p.num,
        role: 'tab',
        'aria-selected': (!accusing && i === index) ? 'true' : 'false'
      }, [
        h('span', { 'class': 'piece-nav-left' }, [
          h('span', { 'class': 'piece-nav-num', text: p.num }),
          h('span', { 'class': 'piece-nav-label', text: L(p.label) })
        ]),
        h('span', { 'class': 'piece-nav-tag ' + tagClass, text: tag })
      ]);
    }));

    var aside = h('aside', { 'class': 'dossier-aside' }, [
      h('div', { 'class': 'aside-head' }, [
        h('a', { 'class': 'backlink', style: 'margin-bottom:14px', href: '#/case/' + kase.id, text: t('backToFile') }),
        h('div', { 'class': 'case-file', style: 'margin-bottom:10px', text: L(kase.entry.file) }),
        h('div', { 'class': 'aside-title', text: L(kase.entry.title) })
      ]),
      h('div', { 'class': 'progress-wrap' }, [
        h('div', { 'class': 'progress-row' }, [
          h('span', { text: t('progress') }),
          h('span', { text: progress + '%' })
        ]),
        h('div', { 'class': 'progress-track' }, [
          h('div', { 'class': 'progress-bar', style: 'width:' + progress + '%' })
        ])
      ]),
      nav,
      h('div', { 'class': 'accuse-wrap' }, [
        h('a', {
          'class': 'btn-accuse' + (accusing ? ' on' : ''),
          href: '#/case/' + kase.id + '/accuse',
          text: t('accuse')
        })
      ])
    ]);

    var body;
    if (accusing) {
      body = renderAccuse(kase, state);
    } else {
      var piece = kase.pieces[index];
      var locked = index >= unlocked;
      body = h('div', {}, [
        h('div', { 'class': 'piece-head' }, [
          h('div', {}, [
            h('div', { 'class': 'piece-kicker', text: piece.num + ' · ' + (locked ? t('sealed') : t('document')) }),
            h('h2', { text: L(piece.label) })
          ]),
          h('div', { 'class': 'piece-stamp', text: L(kase.stamp) })
        ]),
        locked ? renderLocked() : renderPiece(kase, piece)
      ]);
    }

    return h('div', { 'class': 'dossier rise' }, [
      aside,
      h('main', { 'class': 'dossier-main' }, [body])
    ]);
  }

  function renderLocked() {
    return h('div', { 'class': 'locked' }, [
      h('div', { 'class': 'eyebrow', text: t('lockedEyebrow') }),
      h('h3', { text: t('lockedTitle') }),
      h('p', { text: t('lockedNote') })
    ]);
  }

  /* ── Document renderers, one per piece type ───────────────────────────── */

  var RENDERERS = {

    report: function (kase, p) {
      return h('div', { 'class': 'split' }, [
        h('div', { 'class': 'report' }, (p.blocks || []).map(function (b) {
          return h('div', { 'class': 'report-block' }, [
            h('div', { 'class': 'report-head', text: L(b.head) }),
            h('div', { 'class': 'report-text', text: L(b.text) })
          ]);
        })),
        h('div', { 'class': 'panel' }, [h('div', { 'class': 'label', text: t('attachments') })].concat(
          (p.attachments || []).map(function (a) {
            return h('div', { 'class': 'attachment' }, [
              h('div', { 'class': 'attachment-thumb' }),
              h('div', { style: 'min-width:0' }, [
                h('div', { style: 'font-size:13px', text: L(a.title) }),
                h('div', { 'class': 'attachment-meta', text: L(a.meta) })
              ])
            ]);
          })
        ))
      ]);
    },

    scene: function (kase, p) {
      return h('div', { 'class': 'split' }, [
        media(p.image, L(p.label), 'mapSlot', 'scene-img hatch'),
        h('div', { 'class': 'pinlist' }, (p.pins || []).map(function (pin) {
          return h('div', { 'class': 'pin' }, [
            h('div', { 'class': 'pin-key', text: L(pin.pin) }),
            h('div', { 'class': 'pin-text', text: L(pin.text) })
          ]);
        }))
      ]);
    },

    forensics: function (kase, p) {
      var head = h('div', { 'class': 'trow thead' }, [
        h('div', { text: t('colRef') }), h('div', { text: t('colFinding') }),
        h('div', { text: t('colMethod') }), h('div', { style: 'text-align:right', text: t('colStatus') })
      ]);
      var rows = (p.rows || []).map(function (r) {
        return h('div', { 'class': 'trow' }, [
          h('div', { 'class': 'tref', text: L(r.ref) }),
          h('div', {}, [
            h('div', { 'class': 'tcell-label', text: t('colFinding') }),
            h('div', { 'class': 'tfinding', text: L(r.finding) })
          ]),
          h('div', {}, [
            h('div', { 'class': 'tcell-label', text: t('colMethod') }),
            h('div', { 'class': 'tmethod', text: L(r.method) })
          ]),
          h('div', { 'class': 'tstatus' + (r.conclusive ? ' strong' : ''), text: L(r.status) })
        ]);
      });
      return h('div', { 'class': 'table' }, [head].concat(rows));
    },

    comms: function (kase, p) {
      return h('div', { 'class': 'split' }, [
        h('div', { 'class': 'threads' }, (p.messages || []).map(function (m) {
          return h('div', { 'class': 'msg-row ' + (m.side === 'subject' ? 'subject' : 'them') }, [
            h('div', { 'class': 'bubble' }, [
              h('div', { 'class': 'bubble-who', text: L(m.who) + ' · ' + L(m.time) }),
              h('div', { 'class': 'bubble-text', text: L(m.text) })
            ])
          ]);
        })),
        h('div', { 'class': 'panel' }, [h('div', { 'class': 'label', text: t('callLog') })].concat(
          (p.calls || []).map(function (c) {
            return h('div', { 'class': 'callrow' }, [
              h('span', { 'class': 'callnum', text: L(c.num) }),
              h('span', { 'class': 'callmeta', text: L(c.meta) })
            ]);
          })
        ))
      ]);
    },

    suspects: function (kase) {
      return h('div', { 'class': 'suspects' }, kase.suspects.map(function (s) {
        return h('a', { 'class': 'suspect', href: '#/case/' + kase.id + '/accuse' }, [
          media(s.photo, L(s.name), 'photoSlot', 'suspect-photo hatch'),
          h('div', { 'class': 'suspect-body' }, [
            h('div', { 'class': 'suspect-name', text: L(s.name) }),
            h('div', { 'class': 'suspect-role', text: L(s.role) }),
            h('div', { 'class': 'suspect-note', text: L(s.note) })
          ])
        ]);
      }));
    },

    /* A real search, not a mock: the player can look a name or plate up and
       the matching text is highlighted in place. */
    database: function (kase, p) {
      var rows = p.rows || [];
      var results = h('div', { 'class': 'table' });

      function paint(query) {
        clear(results);
        var q = query.trim().toLowerCase();
        var hits = !q ? rows : rows.filter(function (r) {
          return [r.code, r.title, r.src, r.type].some(function (field) {
            return L(field).toLowerCase().indexOf(q) !== -1;
          });
        });
        if (!hits.length) {
          results.appendChild(h('div', { 'class': 'trow' }, [h('div', { 'class': 'tfinding', text: t('noResults') })]));
          return;
        }
        hits.forEach(function (r) {
          results.appendChild(h('div', { 'class': 'dbrow' }, [
            h('div', { 'class': 'dbcode', html: highlight(L(r.code), q) }),
            h('div', { style: 'display:flex;flex-direction:column;gap:5px' }, [
              h('div', { 'class': 'dbtitle', html: highlight(L(r.title), q) }),
              h('div', { 'class': 'dbsrc', html: highlight(L(r.src), q) })
            ]),
            h('div', { 'class': 'dbtype', html: highlight(L(r.type), q) })
          ]));
        });
      }

      var input = h('input', {
        type: 'search', placeholder: t('searchPlaceholder'), 'aria-label': t('search'),
        onInput: function (e) { paint(e.target.value); }
      });
      paint('');

      return h('div', { style: 'display:flex;flex-direction:column;gap:24px' }, [
        h('div', { 'class': 'searchbar' }, [input]),
        results
      ]);
    },

    notepad: function (kase, p) {
      var saved = h('div', {
        'class': 'notesaved',
        text: Store.available ? t('notesSaved') : t('notesNotSaved')
      });
      var timer = null;
      var area = h('textarea', {
        'class': 'notepad', placeholder: t('notepadPlaceholder'), 'aria-label': t('notepadHint'),
        onInput: function (e) {
          var value = e.target.value;
          clearTimeout(timer);
          timer = setTimeout(function () { Store.setNotes(kase.id, value); }, 400);
        }
      });
      area.value = Store.getCase(kase.id).notes;

      return h('div', { 'class': 'split' }, [
        h('div', { style: 'display:flex;flex-direction:column;gap:12px' }, [
          h('div', { 'class': 'label', text: t('notepadHint') }),
          area,
          saved
        ]),
        h('div', { 'class': 'pinlist' }, (p.pinned || []).map(function (x) {
          return h('div', { 'class': 'pinned-item' }, [
            h('div', { 'class': 'pinned-tag', text: L(x.tag) }),
            h('div', { 'class': 'pinned-text', text: L(x.text) })
          ]);
        }))
      ]);
    }
  };

  function renderPiece(kase, piece) {
    var fn = RENDERERS[piece.type];
    if (!fn) return h('div', { 'class': 'empty', text: 'Unknown document type: ' + piece.type });
    return fn(kase, piece);
  }

  function highlight(text, query) {
    var f = document.createDocumentFragment();
    if (!query) { f.appendChild(document.createTextNode(text)); return f; }
    var lower = text.toLowerCase(), from = 0, at;
    while ((at = lower.indexOf(query, from)) !== -1) {
      if (at > from) f.appendChild(document.createTextNode(text.slice(from, at)));
      f.appendChild(h('mark', { text: text.slice(at, at + query.length) }));
      from = at + query.length;
    }
    if (from < text.length) f.appendChild(document.createTextNode(text.slice(from)));
    return f;
  }

  /* ── Accuse ───────────────────────────────────────────────────────────── */

  function renderAccuse(kase, state) {
    var solution = kase.solution || {};
    var culprit = typeof solution.culprit === 'number' ? solution.culprit : 0;
    var chosen = state.accused;

    var options = h('div', { 'class': 'accuse-options' }, kase.suspects.map(function (s, i) {
      return h('button', {
        type: 'button',
        'class': 'accuse-option' + (chosen === i ? ' on' : ''),
        text: L(s.name),
        onClick: function () { Store.setAccused(kase.id, i, i === culprit); render(); }
      });
    }));

    // Backfill for answers given before the result was recorded, so an old
    // solve still counts towards the rank on the next visit.
    if (chosen !== null && chosen !== undefined && state.correct === null) {
      Store.setAccused(kase.id, chosen, chosen === culprit);
    }

    var kids = [
      h('p', { text: t('accuseIntro') }),
      options
    ];

    if (chosen !== null && chosen !== undefined) {
      var correct = chosen === culprit;
      var body = correct
        ? L(solution.correct)
        : (L(kase.suspects[chosen] && kase.suspects[chosen].cleared) || L(solution.wrong));

      kids.push(h('div', { 'class': 'result' + (correct ? ' correct' : '') }, [
        h('div', {
          'class': 'result-eyebrow',
          style: 'color:' + (correct ? 'var(--crimson)' : 'var(--dim-2)'),
          text: correct ? t('rightEyebrow') : t('wrongEyebrow')
        }),
        h('h3', { text: L(correct ? solution.correctTitle : solution.wrongTitle) }),
        h('p', { text: body }),
        h('div', { 'class': 'result-actions' }, [
          h('a', { href: '#/', text: t('nextCase') }),
          h('button', { type: 'button', text: t('shareCard'), onClick: shareCard(kase, correct) }),
          h('button', { type: 'button', text: t('shareResult'), onClick: shareCase(kase) }),
          !correct && h('button', {
            type: 'button', text: t('tryAgain'),
            onClick: function () { Store.setAccused(kase.id, null); render(); }
          })
        ])
      ]));
    }

    return h('div', { 'class': 'accuse' }, kids);
  }

  function shareCase(kase) {
    return function (e) {
      var url = caseUrl(kase);
      var title = L(kase.entry.title);
      if (navigator.share) {
        navigator.share({ title: title, url: url }).catch(function () {});
        return;
      }
      var btn = e.currentTarget, original = btn.textContent;
      var done = function () { btn.textContent = t('shareCopied'); setTimeout(function () { btn.textContent = original; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () {});
      else done();
    };
  }

  /* ── Share card ───────────────────────────────────────────────────────── */

  /* A result is worth more as an image than as a link: a story sticker gets
     seen, a bare URL does not. The card is drawn on a canvas at 4:5 — the
     aspect Instagram crops least — from assets already on this origin, so
     nothing taints the canvas and no server is involved. */

  var CARD = { w: 1080, h: 1350, pad: 80, band: 720 };

  function caseUrl(kase) {
    return location.origin + location.pathname + '#/case/' + kase.id;
  }

  function loadImage(src) {
    return new Promise(function (resolve) {
      if (!src) { resolve(null); return; }
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };   // card still works without art
      img.src = src;
    });
  }

  function cardFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('700 76px Oswald'),
      document.fonts.load('500 26px "IBM Plex Mono"')
    ]).catch(function () { /* fall back to the generic families */ });
  }

  function drawCover(ctx, img, x, y, w, h) {
    var scale = Math.max(w / img.width, h / img.height);
    var dw = img.width * scale, dh = img.height * scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    ctx.restore();
  }

  /* Canvas letter-spacing is still uneven across browsers, so the tracked
     mono caps that carry this design are drawn a character at a time. */
  function trackedWidth(ctx, text, spacing) {
    var total = 0;
    for (var i = 0; i < text.length; i++) total += ctx.measureText(text[i]).width + spacing;
    return text.length ? total - spacing : 0;
  }

  function drawTracked(ctx, text, x, y, spacing) {
    for (var i = 0; i < text.length; i++) {
      ctx.fillText(text[i], x, y);
      x += ctx.measureText(text[i]).width + spacing;
    }
  }

  function wrapLines(ctx, text, maxWidth, maxLines) {
    var words = String(text).split(/\s+/), lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var next = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = words[i]; }
      else { line = next; }
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      lines[maxLines - 1] = lines[maxLines - 1].replace(/[\s.,;:]+$/, '') + '…';
    }
    return lines;
  }

  function buildCard(kase, correct) {
    var art = (kase.keyArt || (kase.entry && kase.entry.cover)) || null;

    return Promise.all([loadImage(art), cardFonts()]).then(function (loaded) {
      var img = loaded[0];
      var canvas = document.createElement('canvas');
      canvas.width = CARD.w;
      canvas.height = CARD.h;
      var ctx = canvas.getContext('2d');
      var pad = CARD.pad, inner = CARD.w - pad * 2;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CARD.w, CARD.h);

      if (img) {
        drawCover(ctx, img, 0, 0, CARD.w, CARD.band);
      } else {
        ctx.fillStyle = '#0C0C0C';
        ctx.fillRect(0, 0, CARD.w, CARD.band);
      }

      // Fade the art into the page so the type below always has contrast.
      var fade = ctx.createLinearGradient(0, CARD.band - 380, 0, CARD.band);
      fade.addColorStop(0, 'rgba(0,0,0,0)');
      fade.addColorStop(1, '#000');
      ctx.fillStyle = fade;
      ctx.fillRect(0, CARD.band - 380, CARD.w, 380);

      ctx.textBaseline = 'alphabetic';

      /* The block is laid out upward from the footer rule. Anchoring it to the
         bottom rather than to the art keeps a three-line title off the footer
         and stops a one-line title leaving a hole in the middle. */
      var ruleY = CARD.h - 172;
      var rankY = ruleY - 46;

      var size = 78, lineH = 88;
      ctx.font = '700 ' + size + 'px Oswald, sans-serif';
      var lines = wrapLines(ctx, L(kase.entry.title).toUpperCase(), inner, 3);
      if (lines.length > 2) {
        size = 62; lineH = 72;
        ctx.font = '700 ' + size + 'px Oswald, sans-serif';
        lines = wrapLines(ctx, L(kase.entry.title).toUpperCase(), inner, 3);
      }

      var lastBaseline = rankY - 62;
      var firstBaseline = lastBaseline - (lines.length - 1) * lineH;
      // Clear the title's cap height, which sits above its own baseline.
      var fileY = firstBaseline - Math.round(size * 0.72) - 30;
      var bh = 62;
      var by = fileY - 44 - bh;

      // Verdict badge — filled when solved, outlined when not.
      var badge = (correct ? t('cardSolved') : t('cardUnsolved')).toUpperCase();
      ctx.font = '500 26px "IBM Plex Mono", monospace';
      var bw = trackedWidth(ctx, badge, 4) + 56;
      if (correct) {
        ctx.fillStyle = '#920805';
        ctx.fillRect(pad, by, bw, bh);
        ctx.fillStyle = '#EAE9E4';
      } else {
        ctx.strokeStyle = 'rgba(234,233,228,.38)';
        ctx.lineWidth = 2;
        ctx.strokeRect(pad + 1, by + 1, bw - 2, bh - 2);
        ctx.fillStyle = 'rgba(234,233,228,.78)';
      }
      drawTracked(ctx, badge, pad + 28, by + 40, 4);

      // File number.
      ctx.font = '500 24px "IBM Plex Mono", monospace';
      ctx.fillStyle = 'rgba(234,233,228,.45)';
      drawTracked(ctx, L(kase.entry.file).toUpperCase(), pad, fileY, 5);

      // Title.
      ctx.font = '700 ' + size + 'px Oswald, sans-serif';
      ctx.fillStyle = '#EAE9E4';
      lines.forEach(function (line, i) {
        ctx.fillText(line, pad, firstBaseline + i * lineH);
      });

      // Rank, once there is one worth printing.
      var stats = Store.stats();
      ctx.font = '500 26px "IBM Plex Mono", monospace';
      ctx.fillStyle = 'rgba(234,233,228,.6)';
      var meta = stats.solved
        ? I18N.pick(rankFor(stats.solved).current.name, lang).toUpperCase() + '  ·  ' +
          stats.solved + ' ' + t(stats.solved === 1 ? 'rankSolvedOne' : 'rankSolvedMany').toUpperCase()
        : L(kase.entry.meta).toUpperCase();
      drawTracked(ctx, meta, pad, rankY, 4);

      // Footer rule and call to action.
      ctx.fillStyle = 'rgba(234,233,228,.14)';
      ctx.fillRect(pad, ruleY, inner, 1);

      ctx.font = '700 40px Oswald, sans-serif';
      ctx.fillStyle = '#EAE9E4';
      ctx.fillText('VERDICT', pad, CARD.h - 96);
      var vw = ctx.measureText('VERDICT').width;
      ctx.fillStyle = '#B30A06';
      ctx.fillText('60', pad + vw, CARD.h - 96);

      ctx.font = '500 24px "IBM Plex Mono", monospace';
      ctx.fillStyle = 'rgba(234,233,228,.5)';
      var handle = '@verdictin60';
      var hw = trackedWidth(ctx, handle, 3);
      drawTracked(ctx, handle, CARD.w - pad - hw, CARD.h - 100, 3);

      ctx.fillStyle = 'rgba(234,233,228,.38)';
      drawTracked(ctx, t('cardCta').toUpperCase(), pad, CARD.h - 56, 4);

      return new Promise(function (resolve) {
        if (canvas.toBlob) canvas.toBlob(resolve, 'image/png');
        else resolve(null);
      });
    });
  }

  function shareCard(kase, correct) {
    return function (e) {
      var btn = e.currentTarget, original = btn.textContent;
      var restore = function (msg) {
        btn.textContent = msg;
        setTimeout(function () { btn.textContent = original; }, 1600);
      };
      btn.textContent = t('shareBuilding');
      btn.disabled = true;

      buildCard(kase, correct).then(function (blob) {
        btn.disabled = false;
        if (!blob) { shareCase(kase)(e); return; }

        var name = 'verdict60-' + kase.id + '.png';
        var file = null;
        try { file = new File([blob], name, { type: 'image/png' }); } catch (err) { /* older Safari */ }

        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            text: L(kase.entry.title) + ' — ' + caseUrl(kase)
          }).then(function () { btn.textContent = original; }, function () { btn.textContent = original; });
          return;
        }

        // No file sharing here — save the card and put the link on the clipboard
        // so the two can be posted together.
        var url = URL.createObjectURL(blob);
        var a = h('a', { href: url, download: name });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        if (navigator.clipboard) navigator.clipboard.writeText(caseUrl(kase)).catch(function () {});
        restore(t('shareSaved'));
      }, function () {
        btn.disabled = false;
        shareCase(kase)(e);   // canvas unavailable — the link still works
      });
    };
  }

  /* ── Screen: how it works ─────────────────────────────────────────────── */

  function renderHow() {
    return h('div', { 'class': 'wrap how rise' }, [
      h('div', { 'class': 'eyebrow', text: t('howEyebrow') }),
      h('h1', { text: t('howTitle') }),
      h('p', { 'class': 'how-intro', text: t('howIntro') }),
      h('div', { 'class': 'steps' }, t('steps').map(function (s) {
        return h('div', { 'class': 'step' }, [
          h('div', { 'class': 'step-num', text: s[0] }),
          h('div', { 'class': 'step-title', text: s[1] }),
          h('div', { 'class': 'step-text', text: s[2] })
        ]);
      })),
      h('div', { 'class': 'faq' }, t('faq').map(function (f) {
        return h('div', { 'class': 'faq-item' }, [
          h('div', { 'class': 'faq-q', text: f[0] }),
          h('div', { 'class': 'faq-a', text: f[1] })
        ]);
      }))
    ]);
  }

  function renderMessage(text) {
    return h('div', { 'class': 'wrap' }, [
      h('div', { 'class': 'empty', text: text }),
      h('div', { style: 'text-align:center;margin-top:20px' }, [
        h('a', { 'class': 'backlink', href: '#/', text: t('back') })
      ])
    ]);
  }

  /* ── Router ───────────────────────────────────────────────────────────── */

  function parseRoute() {
    var raw = location.hash.replace(/^#\/?/, '');
    var parts = raw.split('/').filter(Boolean).map(decodeURIComponent);
    if (!parts.length) return { name: 'index' };
    if (parts[0] === 'how') return { name: 'how' };
    if (parts[0] === 'case' && parts[1]) {
      return { name: parts[2] ? 'dossier' : 'detail', id: parts[1], param: parts[2] };
    }
    return { name: 'index' };
  }

  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  var renderToken = 0;

  function render() {
    var route = parseRoute();
    var token = ++renderToken;
    paintChrome(route.name === 'how' ? 'how' : 'index');

    function show(node) {
      if (token !== renderToken) return;   // a newer navigation already won
      clear(main);
      main.appendChild(node);
    }

    loadManifest().then(function () {
      if (route.name === 'index') return show(renderIndex());
      if (route.name === 'how') return show(renderHow());

      if (!entryFor(route.id)) return show(renderMessage(t('notFound')));

      show(h('div', { 'class': 'wrap' }, [h('div', { 'class': 'empty', text: t('loading') })]));

      return loadCase(route.id).then(function (kase) {
        if (route.name === 'detail') return show(renderDetail(kase));

        // The gate belongs to the file, so a shared deep link into a document
        // still lands on the landing page until it has been passed.
        if (CONFIG.gateEnabled && !Store.hasFollowed()) return show(renderDetail(kase));

        show(renderDossier(kase, route.param));
      });
    }).catch(function (err) {
      if (token !== renderToken) return;
      show(renderMessage(err && err.message === 'unknown-case' ? t('notFound') : t('loadError')));
    });
  }

  /* ── Boot ─────────────────────────────────────────────────────────────── */

  document.querySelectorAll('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      lang = btn.getAttribute('data-lang');
      Store.setLang(lang);
      render();
    });
  });

  var viewBtn = document.querySelector('[data-viewswitch]');
  if (viewBtn) {
    viewBtn.addEventListener('click', function () {
      Store.setView(Store.getView() === 'desktop' ? 'auto' : 'desktop');
      applyView();
      render();
    });
  }

  applyView();   // a choice made last visit is restored before the first paint

  window.addEventListener('hashchange', function () {
    render();
    window.scrollTo(0, 0);
  });

  render();
})(window);
