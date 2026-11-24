import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCENTS,
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  normalizeAccent,
  normalizeTheme,
  saveAppearance,
} from '../src/utils/theme.js';

test('theme normalisation accepts only light/dark and known accents', () => {
  assert.equal(normalizeTheme('dark'), 'dark');
  assert.equal(normalizeTheme('light'), 'light');
  assert.equal(normalizeTheme('system'), DEFAULT_THEME);
  assert.equal(normalizeTheme(undefined), DEFAULT_THEME);
  assert.equal(normalizeAccent('emerald'), 'emerald');
  assert.equal(normalizeAccent('unknown'), DEFAULT_ACCENT);
  assert.equal(normalizeAccent(null), DEFAULT_ACCENT);
});

test('accent presets have unique ids and both light/dark swatches', () => {
  const ids = ACCENTS.map(accent => accent.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 4 && ids.length <= 7);
  for (const accent of ACCENTS) {
    assert.match(accent.swatch, /^#[0-9a-f]{6}$/i);
    assert.match(accent.swatchDark, /^#[0-9a-f]{6}$/i);
    assert.match(accent.labelKey, /^settings\.accent_[a-z]+$/);
  }
});

test('saveAppearance persists and applies document attributes', () => {
  const store = new Map();
  const attributes = {};
  const meta = { content: '', setAttribute(name, value) { if (name === 'content') this.content = value; } };
  const fakeLocalStorage = {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
  };
  const fakeDocument = {
    documentElement: { setAttribute: (name, value) => { attributes[name] = value; }, style: {} },
    querySelector: () => meta,
  };

  Object.defineProperty(globalThis, 'localStorage', { value: fakeLocalStorage, configurable: true });
  Object.defineProperty(globalThis, 'document', { value: fakeDocument, configurable: true });
  try {
    assert.deepEqual(saveAppearance('dark', 'emerald'), { theme: 'dark', accent: 'emerald' });
    assert.equal(store.get(THEME_STORAGE_KEY), 'dark');
    assert.equal(store.get(ACCENT_STORAGE_KEY), 'emerald');
    assert.equal(attributes['data-theme'], 'dark');
    assert.equal(attributes['data-accent'], 'emerald');
    assert.equal(meta.content, '#090e18');

    assert.deepEqual(saveAppearance('bogus', 'bogus'), { theme: 'light', accent: 'violet' });
    assert.equal(attributes['data-theme'], 'light');
    assert.equal(attributes['data-accent'], 'violet');
    assert.equal(meta.content, '#e9effa');
  } finally {
    delete globalThis.localStorage;
    delete globalThis.document;
  }
});
