const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

// Model media playback and page lifecycle events.
function makePage() {
  class Target {
    listeners = new Map();
    addEventListener(type, listener) {
      const listeners = this.listeners.get(type) || [];
      listeners.push(listener);
      this.listeners.set(type, listeners);
    }
    dispatch(type, event = {}) {
      for (const listener of this.listeners.get(type) || []) listener(event);
    }
  }
  class Video extends Target {
    paused = false;
    muted = true;
    rejectSound = null;
    play() {
      if (!this.muted) {
        this.paused = true;
        return new Promise((resolve, reject) => { this.rejectSound = reject; });
      }
      this.paused = false;
      return Promise.resolve();
    }
    pause() { this.paused = true; }
  }
  const clips = [new Video(), new Video()].map(video => {
    const frame = new Target();
    frame.querySelector = () => video;
    return { frame, video };
  });
  const inert = new Target();
  const document = new Target();
  document.hidden = false;
  document.querySelector = () => inert;
  document.querySelectorAll = selector => selector === '.feature-video' ? clips.map(clip => clip.frame) : [];
  const window = new Target();
  vm.runInNewContext(readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8'), { document, window });
  return { clips, document, window };
}

test('starting a video pauses the other stream', () => {
  const { clips } = makePage();
  clips[0].video.dispatch('play');
  assert.equal(clips[1].video.paused, true);
});

test('returning to the page restores playing videos but leaves manually paused videos paused', async () => {
  const { clips, document } = makePage();
  clips[1].video.paused = true;
  document.hidden = true;
  document.dispatch('visibilitychange');
  assert.equal(clips[0].video.paused, true);
  document.hidden = false;
  document.dispatch('visibilitychange');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(clips[0].video.paused, false);
  assert.equal(clips[0].video.muted, true);
  assert.equal(clips[1].video.paused, true);
});
