/* =========================================================
   Music Mood Mehfil · survey front-end (plain JavaScript)
   - Builds the tap-to-answer chips from the lists below
   - Walks through the steps
   - Sends one JSON request to POST /api/responses
   ========================================================= */
(() => {
  'use strict';

  /* ---------- Settings ---------- */

  // Leave empty when the website and API are served together (the default setup).
  // Only set this (e.g. "https://my-api.onrender.com") if you host the frontend somewhere else.
  const API_BASE = '';

  const TOTAL_STEPS = 4;
  const ANON_KEY = 'mmm_anon_id';

  /* ---------- Questions (edit these lists freely) ---------- */

  const GENDER = [
    { label: 'Male' },
    { label: 'Female' },
    { label: 'Non-binary' },
    { label: 'Prefer not to say' },
  ];

  const MOODS = [
    { label: 'Happy', emoji: '😄' },
    { label: 'Sad', emoji: '😢' },
    { label: 'Angry', emoji: '😠' },
    { label: 'Tired', emoji: '😴' },
    { label: 'Depressed', emoji: '🌧️' },
    { label: 'Stressed', emoji: '😵' },
    { label: 'Lonely', emoji: '🌙' },
    { label: 'Heartbroken', emoji: '💔' },
    { label: 'Romantic', emoji: '💖' },
    { label: 'Nostalgic', emoji: '🕰️' },
    { label: 'Calm', emoji: '🌿' },
    { label: 'Excited', emoji: '🤩' },
    { label: 'Motivated', emoji: '🔥' },
  ];

  const ACTIVITIES = [
    { label: 'Travelling', emoji: '🚌' },
    { label: 'Walking', emoji: '🚶' },
    { label: 'Studying', emoji: '📚' },
    { label: 'Working', emoji: '💻' },
    { label: 'Cooking', emoji: '🍳' },
    { label: 'Household chores', emoji: '🧹' },
    { label: 'Workout', emoji: '🏋️' },
    { label: 'Driving', emoji: '🚗' },
    { label: 'Getting ready', emoji: '✨' },
    { label: 'Before sleep', emoji: '🛏️' },
    { label: 'With friends', emoji: '🎉' },
    { label: 'Gaming', emoji: '🎮' },
    { label: 'Festivals & puja', emoji: '🪔' },
  ];

  const TIMES = [
    { label: 'Early morning (5–8 am)', emoji: '🌄' },
    { label: 'Morning (8 am–12)', emoji: '☀️' },
    { label: 'Afternoon (12–4 pm)', emoji: '🌤️' },
    { label: 'Evening (4–8 pm)', emoji: '🌇' },
    { label: 'Night (8 pm–12)', emoji: '🌙' },
    { label: 'Late night (12–5 am)', emoji: '🦉' },
  ];

  const ISSUES = [
    { label: 'Same songs keep repeating', emoji: '🔁' },
    { label: "Doesn't match my mood", emoji: '🎭' },
    { label: 'Ignores what I am doing', emoji: '🏃' },
    { label: 'Hard to find new songs I love', emoji: '🧭' },
    { label: 'Too many ads or promoted songs', emoji: '📢' },
    { label: "Doesn't get my language taste", emoji: '🗣️' },
    { label: 'Ignores the time of day', emoji: '🕐' },
    { label: 'Feels generic, same for everyone', emoji: '🥱' },
    { label: "I'm happy with them", emoji: '😊' },
  ];

  const IDEAL = [
    { label: 'Based on my mood', emoji: '🎭' },
    { label: 'Based on my activity', emoji: '🏃' },
    { label: 'Based on time of day', emoji: '🕐' },
    { label: 'Similar to my favourites', emoji: '💛' },
    { label: 'Mix of familiar and new', emoji: '🎲' },
    { label: 'New artists and genres', emoji: '🌍' },
    { label: 'Surprise me!', emoji: '🎁' },
  ];

  /* ---------- Small helpers ---------- */

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Collapse extra spaces and cut to a maximum length.
  const tidy = (text, max) => String(text || '').replace(/\s+/g, ' ').trim().slice(0, max);

  const sameText = (a, b) => a.toLowerCase() === b.toLowerCase();

  let uid = 0;
  const nextId = (prefix) => `${prefix}-${++uid}`;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text; // textContent only: never inserts HTML
    return node;
  }

  // Search iTunes and report a selected track without inserting returned text as HTML.
  function attachSongSearch(input, results, onSelect) {
    let timer = null;
    let controller = null;
    let sequence = 0;

    const hide = () => {
      clearTimeout(timer);
      if (controller) controller.abort();
      sequence += 1;
      results.hidden = true;
      results.textContent = '';
    };

    const showStatus = (message) => {
      results.textContent = '';
      results.appendChild(el('div', 'song-search__status', message));
      results.hidden = false;
    };

    input.setAttribute('aria-autocomplete', 'list');
    results.setAttribute('role', 'listbox');
    results.setAttribute('aria-label', 'iTunes song search results');

    input.addEventListener('input', () => {
      clearTimeout(timer);
      if (controller) controller.abort();
      const query = tidy(input.value, 100);
      if (query.length < 2) {
        hide();
        return;
      }

      const thisSequence = ++sequence;
      timer = setTimeout(async () => {
        controller = new AbortController();
        showStatus('Searching songs…');
        try {
          const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=12`;
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) throw new Error('iTunes search failed');
          const data = await response.json();
          if (thisSequence !== sequence) return;

          const tracks = (data.results || []).filter((track) => track.trackName && track.artistName);
          results.textContent = '';
          if (!tracks.length) {
            showStatus('No matching songs. You can still type your own.');
            return;
          }

          tracks.forEach((track) => {
            const option = el('button', 'song-search__result');
            option.type = 'button';
            option.setAttribute('role', 'option');
            option.dataset.songTitle = track.trackName;
            option.dataset.songArtist = track.artistName;
            option.append(
              el('span', 'song-search__title', track.trackName),
              el('span', 'song-search__artist', track.artistName)
            );
            results.appendChild(option);
          });
          results.hidden = false;
        } catch (error) {
          if (error.name === 'AbortError' || thisSequence !== sequence) return;
          showStatus('Song search is unavailable. You can still type your own.');
        }
      }, 300);
    });

    results.addEventListener('mousedown', (event) => event.preventDefault());
    results.addEventListener('click', (event) => {
      const option = event.target.closest('[data-song-title]');
      if (!option) return;
      const song = tidy(`${option.dataset.songTitle} — ${option.dataset.songArtist}`, 100);
      hide();
      onSelect(song);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') hide();
    });
    input.addEventListener('blur', () => setTimeout(hide, 150));
  }

  /* ---------- Anonymous browser code ---------- */

  let memoryId = null; // used only if the browser blocks localStorage

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function getAnonId() {
    const valid = /^[A-Za-z0-9-]{16,64}$/;
    try {
      const saved = window.localStorage.getItem(ANON_KEY);
      if (saved && valid.test(saved)) return saved;
      const fresh = makeId();
      window.localStorage.setItem(ANON_KEY, fresh);
      return fresh;
    } catch (err) {
      if (!memoryId) memoryId = makeId();
      return memoryId;
    }
  }

  /* ---------- Chip group (tap options + "add your own") ---------- */

  class ChipGroup {
    /**
     * @param {HTMLElement} root       where to draw the group
     * @param {object} cfg
     *   sections     [{ title?, options: [{label, emoji?}] }]
     *   single       true => only one answer allowed (preset OR own)
     *   maxOwn       how many "own" answers are allowed
     *   maxLen       max length of one own answer
     *   ownLabel     small text above the input
     *   ownPlaceholder
     *   onChange     called after every change
     */
    constructor(root, cfg) {
      this.root = root;
      this.sections = cfg.sections;
      this.single = Boolean(cfg.single);
      this.maxOwn = cfg.single ? 1 : cfg.maxOwn || 5;
      this.maxLen = cfg.maxLen || 60;
      this.ownLabel = cfg.ownLabel || 'Not listed? Add your own';
      this.ownPlaceholder = cfg.ownPlaceholder || 'Type here…';
      this.onChange = cfg.onChange || (() => {});
      this.songSearch = Boolean(cfg.songSearch);
      this.selected = []; // preset labels (in tap order)
      this.customs = []; // own answers
      this.emojiByLabel = new Map();
      this.presetLabels = [];
      this.build();
    }

    build() {
      this.root.textContent = '';

      this.chipButtons = new Map();
      this.sections.forEach((section) => {
        if (!section.options.length) return;
        const wrap = el('div', 'chip-section');
        if (section.title) wrap.appendChild(el('p', 'chip-section__title', section.title));
        const list = el('div', 'chips');
        section.options.forEach((opt) => {
          this.presetLabels.push(opt.label);
          if (opt.emoji) this.emojiByLabel.set(opt.label, opt.emoji);
          const btn = el('button', 'chip');
          btn.type = 'button';
          btn.setAttribute('aria-pressed', 'false');
          btn.dataset.label = opt.label;
          if (opt.emoji) {
            const emoji = el('span', 'chip__emoji', opt.emoji);
            emoji.setAttribute('aria-hidden', 'true');
            btn.appendChild(emoji);
          }
          btn.appendChild(el('span', 'chip__text', opt.label));
          this.chipButtons.set(opt.label, btn);
          list.appendChild(btn);
        });
        wrap.appendChild(list);
        this.root.appendChild(wrap);
      });

      // Own answers appear here as pink chips
      this.ownChips = el('div', 'chips chips--own');
      this.root.appendChild(this.ownChips);

      // "Add your own" row
      const inputId = nextId('own');
      const own = el('div', 'own');
      const label = el('label', 'own__label', this.ownLabel);
      label.htmlFor = inputId;
      const row = el('div', 'own__row');
      this.input = el('input', 'input');
      this.input.type = 'text';
      this.input.id = inputId;
      this.input.maxLength = this.maxLen;
      this.input.placeholder = this.ownPlaceholder;
      this.input.autocomplete = 'off';
      this.addBtn = el('button', 'btn btn--add', '+ Add');
      this.addBtn.type = 'button';
      row.append(this.input, this.addBtn);
      if (this.songSearch) {
        this.searchResults = el('div', 'song-search');
        this.searchResults.hidden = true;
        this.searchResults.setAttribute('role', 'listbox');
        this.searchResults.setAttribute('aria-label', 'Song search results');
        own.classList.add('own--song-search');
        attachSongSearch(this.input, this.searchResults, (song) => {
          this.input.value = song;
          this.addCustom();
        });
      }
      this.note = el('p', 'own__note');
      this.note.hidden = true;
      own.append(label, row);
      if (this.searchResults) own.appendChild(this.searchResults);
      own.appendChild(this.note);
      this.root.appendChild(own);

      // Events
      this.root.addEventListener('click', (event) => {
        const chip = event.target.closest('button.chip');
        if (!chip || !this.root.contains(chip)) return;
        if (chip.dataset.own !== undefined) this.removeCustom(chip.dataset.own);
        else this.togglePreset(chip.dataset.label);
      });
      this.addBtn.addEventListener('click', () => this.addCustom());
      this.input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault(); // Enter should add the answer, not submit the form
          this.addCustom();
        }
      });
      this.input.addEventListener('input', () => {
        this.hideNote();
      });

      this.refresh();
    }

    togglePreset(label) {
      const index = this.selected.indexOf(label);
      if (index >= 0) {
        this.selected.splice(index, 1);
      } else {
        if (this.single) {
          this.selected = [];
          this.customs = [];
        }
        this.selected.push(label);
      }
      this.changed();
    }

    removeCustom(label) {
      this.customs = this.customs.filter((c) => c !== label);
      this.changed();
    }

    /** Adds whatever is typed in the box. Returns true if something was added. */
    addCustom() {
      const text = tidy(this.input.value, this.maxLen);
      if (!text) return false;

      // Typed something that already exists as a tap option? Just select that one.
      const preset = this.presetLabels.find((p) => sameText(p, text));
      if (preset) {
        if (!this.selected.includes(preset)) {
          if (this.single) {
            this.selected = [];
            this.customs = [];
          }
          this.selected.push(preset);
        }
        this.input.value = '';
        this.changed();
        return true;
      }

      if (this.customs.some((c) => sameText(c, text))) {
        this.input.value = '';
        return false;
      }

      if (this.single) {
        this.selected = [];
        this.customs = [text];
      } else {
        if (this.customs.length >= this.maxOwn) {
          this.showNote(`You can add up to ${this.maxOwn}. Tap one above to remove it first.`);
          return false;
        }
        this.customs.push(text);
      }
      this.input.value = '';
      this.changed();
      return true;
    }

    /** If someone typed an answer but forgot to press "Add", add it for them. */
    commitPending() {
      if (tidy(this.input.value, this.maxLen)) this.addCustom();
    }

    showNote(message) {
      this.note.textContent = message;
      this.note.hidden = false;
    }

    hideNote() {
      this.note.hidden = true;
    }

    changed() {
      this.hideNote();
      this.refresh();
      this.onChange(this);
    }

    refresh() {
      this.chipButtons.forEach((btn, label) => {
        btn.setAttribute('aria-pressed', this.selected.includes(label) ? 'true' : 'false');
      });

      this.ownChips.textContent = '';
      this.customs.forEach((text) => {
        const chip = el('button', 'chip chip--own');
        chip.type = 'button';
        chip.dataset.own = text;
        chip.setAttribute('aria-label', `Remove ${text}`);
        chip.title = 'Tap to remove';
        chip.appendChild(el('span', 'chip__text', text));
        this.ownChips.appendChild(chip);
      });

      this.addBtn.textContent = this.single ? 'Set' : '+ Add';
    }

    /** Everything chosen, in order: [{ label, isCustom }] */
    items() {
      return [
        ...this.selected.map((label) => ({ label, isCustom: false })),
        ...this.customs.map((label) => ({ label, isCustom: true })),
      ];
    }

    emojiFor(label) {
      return this.emojiByLabel.get(label) || '';
    }

    reset() {
      this.selected = [];
      this.customs = [];
      this.input.value = '';
      this.changed();
    }
  }

  /* ---------- Survey state ---------- */

  const songsByTag = new Map(); // "Studying" -> "Lofi beats"
  let currentScreen = 'intro';
  let currentStep = 0;
  let sending = false;

  const screens = {
    intro: $('#screen-intro'),
    1: $('#screen-1'),
    2: $('#screen-2'),
    3: $('#screen-3'),
    4: $('#screen-4'),
    thanks: $('#screen-thanks'),
  };

  const groups = {};

  groups.gender = new ChipGroup($('#group-gender'), {
    sections: [{ options: GENDER }],
    single: true,
    maxLen: 40,
    ownLabel: 'Prefer to self-describe?',
    ownPlaceholder: 'Type how you identify',
  });

  groups.mood = new ChipGroup($('#group-mood'), {
    sections: [
      { title: 'Moods', options: MOODS },
      { title: 'Activities', options: ACTIVITIES },
    ],
    maxOwn: 6,
    maxLen: 40,
    ownLabel: 'Not listed? Add your own mood or activity',
    ownPlaceholder: 'e.g. Missing home, Gardening…',
    onChange: renderSongsPanel,
  });

  groups.comfort = new ChipGroup($('#group-comfort'), {
    sections: [{ options: [] }],
    maxOwn: 5,
    maxLen: 100,
    ownLabel: 'Type a song (and artist if you like), then press Add',
    ownPlaceholder: 'e.g. Tum Hi Ho, Arijit Singh',
    songSearch: true,
  });

  groups.time = new ChipGroup($('#group-time'), {
    sections: [{ options: TIMES }],
    maxOwn: 3,
    maxLen: 40,
    ownLabel: 'Another time? Add your own',
    ownPlaceholder: 'e.g. During my commute',
  });

  groups.issues = new ChipGroup($('#group-issues'), {
    sections: [{ options: ISSUES }],
    maxOwn: 5,
    maxLen: 60,
    ownLabel: 'Something else that bugs you? Add it',
    ownPlaceholder: 'Type your own',
  });

  groups.ideal = new ChipGroup($('#group-ideal'), {
    sections: [{ options: IDEAL }],
    maxOwn: 5,
    maxLen: 60,
    ownLabel: 'Your own way? Add it',
    ownPlaceholder: 'Type your own',
  });

  const suggestionBox = $('#suggestion');
  const suggestionCount = $('#suggestionCount');
  suggestionBox.addEventListener('input', () => {
    suggestionCount.textContent = String(suggestionBox.value.length);
  });

  /* ---------- Mood → song panel ---------- */

  function renderSongsPanel() {
    const panel = $('#songsPanel');
    const list = $('#songsList');
    const items = groups.mood.items();

    list.textContent = '';
    panel.hidden = items.length === 0;

    items.forEach((item) => {
      const inputId = nextId('song');
      const row = el('div', 'song-row');

      const tag = el('label', 'song-tag');
      tag.htmlFor = inputId;
      const emoji = groups.mood.emojiFor(item.label);
      if (emoji) {
        const e = el('span', null, emoji);
        e.setAttribute('aria-hidden', 'true');
        tag.appendChild(e);
      }
      tag.appendChild(el('span', null, item.label));

      const input = el('input', 'input');
      const songField = el('div', 'song-field');
      const searchResults = el('div', 'song-search');
      searchResults.hidden = true;
      input.type = 'text';
      input.id = inputId;
      input.maxLength = 100;
      input.autocomplete = 'off';
      input.placeholder = 'A song you play then';
      input.value = songsByTag.get(item.label) || '';
      input.addEventListener('input', () => songsByTag.set(item.label, input.value));
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') event.preventDefault();
      });

      songField.append(input, searchResults);
      row.append(tag, songField);
      list.appendChild(row);
      attachSongSearch(input, searchResults, (song) => {
        input.value = song;
        songsByTag.set(item.label, song);
      });
    });
  }

  /* ---------- Screens & progress ---------- */

  function showScreen(name, { focus = true } = {}) {
    Object.entries(screens).forEach(([key, node]) => {
      node.hidden = String(key) !== String(name);
    });
    currentScreen = String(name);

    const isStep = /^[1-4]$/.test(currentScreen);
    currentStep = isStep ? Number(currentScreen) : 0;
    updateProgress();

    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });

    // Move keyboard / screen-reader focus to the new heading
    const heading = $('h1, h2', screens[name]);
    if (focus && heading) heading.focus({ preventScroll: true });
  }

  function updateProgress() {
    const progress = $('#progress');
    progress.hidden = currentStep === 0;
    if (currentStep === 0) return;

    $$('.progress__dots li').forEach((li) => {
      const n = Number(li.dataset.dot);
      li.classList.toggle('is-done', n < currentStep);
      li.classList.toggle('is-current', n === currentStep);
      const number = $('span', li);
      number.textContent = n < currentStep ? '✓' : String(n);
    });
    $('#progressText').textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;
  }

  function goNext() {
    if (currentStep > 0 && currentStep < TOTAL_STEPS) showScreen(currentStep + 1);
  }

  function goBack() {
    if (currentStep > 1) showScreen(currentStep - 1);
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-start]')) showScreen(1);
    else if (event.target.closest('[data-next]')) goNext();
    else if (event.target.closest('[data-prev]')) goBack();
  });

  /* ---------- Build & send the response ---------- */

  function choicePayload(group) {
    return { selected: group.selected.slice(), other: group.customs.slice() };
  }

  function buildPayload() {
    // Add anything typed but not yet "added"
    Object.values(groups).forEach((g) => g.commitPending());

    return {
      anonId: getAnonId(),
      hpCheck: $('#hpCheck').value, // honeypot, should stay empty
      gender: {
        choice: groups.gender.selected[0] || '',
        other: groups.gender.customs[0] || '',
      },
      moodActivities: groups.mood.items().map((item) => ({
        label: item.label,
        isCustom: item.isCustom,
        song: tidy(songsByTag.get(item.label), 100),
      })),
      comfortSongs: groups.comfort.customs.slice(),
      listeningTimes: choicePayload(groups.time),
      platformIssues: choicePayload(groups.issues),
      idealRecs: choicePayload(groups.ideal),
      suggestion: suggestionBox.value.trim().slice(0, 600),
    };
  }

  function hasAnyAnswer(p) {
    const has = (c) => c.selected.length > 0 || c.other.length > 0;
    return Boolean(
      p.gender.choice ||
        p.gender.other ||
        p.moodActivities.length ||
        p.comfortSongs.length ||
        has(p.listeningTimes) ||
        has(p.platformIssues) ||
        has(p.idealRecs) ||
        p.suggestion
    );
  }

  function showMessage(text) {
    const box = $('#formMessage');
    box.textContent = text;
    box.hidden = false;
  }

  function clearMessage() {
    $('#formMessage').hidden = true;
  }

  async function submitSurvey(event) {
    event.preventDefault();
    if (sending) return;
    clearMessage();

    const payload = buildPayload();
    if (!hasAnyAnswer(payload)) {
      showMessage("You haven't picked anything yet. Tap at least one option (even one helps a lot!) and then submit.");
      return;
    }

    const button = $('#submitBtn');
    const originalText = button.textContent;
    sending = true;
    button.disabled = true;
    button.textContent = 'Saving… 🪔';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${API_BASE}/api/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'omit',
        signal: controller.signal,
      });

      let data = {};
      try {
        data = await response.json();
      } catch (err) {
        /* non-JSON reply: handled below */
      }

      if (!response.ok || !data.success) {
        showMessage(data.message || 'Something went wrong. Please try again.');
        return;
      }

      showScreen('thanks');
      celebrate();
    } catch (err) {
      showMessage(
        err && err.name === 'AbortError'
          ? 'That took too long. Please check your internet and try again.'
          : "We couldn't reach the server. Please check your internet and try again."
      );
    } finally {
      clearTimeout(timer);
      sending = false;
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  $('#surveyForm').addEventListener('submit', submitSurvey);

  function celebrate() {
    if (prefersReducedMotion) return;
    const box = $('#sparkles');
    const colors = ['#ffb020', '#f2507b', '#2cc3b4', '#ff7a3d', '#ffd25a'];
    for (let i = 0; i < 36; i += 1) {
      const spark = el('span', 'spark');
      spark.style.setProperty('--x', `${Math.random() * 100}%`);
      spark.style.setProperty('--s', `${8 + Math.random() * 10}px`);
      spark.style.setProperty('--c', colors[i % colors.length]);
      spark.style.setProperty('--d', `${2.8 + Math.random() * 2.4}s`);
      spark.style.setProperty('--delay', `${Math.random() * 0.9}s`);
      spark.style.setProperty('--drift', `${Math.round(Math.random() * 160 - 80)}px`);
      box.appendChild(spark);
    }
    setTimeout(() => { box.textContent = ''; }, 6500);
  }

  /* ---------- Go! ---------- */
  showScreen('intro', { focus: false });
})();
