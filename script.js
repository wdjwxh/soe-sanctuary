const searchToggle = document.querySelector('.search-toggle');
const searchPanel = document.querySelector('#search-panel');
const searchInput = document.querySelector('#archive-search');
const searchResults = document.querySelector('.search-results');
const archiveCards = [...document.querySelectorAll('.archive-card')];
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('#main-nav');

function closeSearch() {
  searchPanel.hidden = true;
  searchToggle.setAttribute('aria-expanded', 'false');
}

function renderSearch() {
  const query = searchInput.value.trim().toLowerCase();
  searchResults.replaceChildren();
  if (!query) return;
  const matches = archiveCards.filter(card => card.dataset.search.toLowerCase().includes(query));
  if (!matches.length) {
    const message = document.createElement('p');
    message.textContent = '没有找到对应分类，试试其他关键词。';
    searchResults.append(message);
    return;
  }
  for (const card of matches) {
    const link = document.createElement('a');
    link.href = card.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = card.querySelector('strong').textContent;
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    link.append(arrow);
    searchResults.append(link);
  }
}

searchToggle.addEventListener('click', () => {
  const opening = searchPanel.hidden;
  searchPanel.hidden = !opening;
  searchToggle.setAttribute('aria-expanded', String(opening));
  if (opening) searchInput.focus();
});
searchInput.addEventListener('input', renderSearch);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !searchPanel.hidden) {
    closeSearch();
    searchToggle.focus();
  }
});
document.addEventListener('click', event => {
  if (!searchPanel.hidden && !searchPanel.contains(event.target) && !searchToggle.contains(event.target)) closeSearch();
});
menuToggle.addEventListener('click', () => {
  const open = mainNav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
});
mainNav.addEventListener('click', event => {
  if (event.target.closest('a')) {
    mainNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', '打开导航菜单');
  }
});

const videoClips = [...document.querySelectorAll('.feature-video')].map(frame => ({
  frame,
  video: frame.querySelector('video')
}));

function playSilently(video) {
  video.muted = true;
  try {
    const playback = video.play();
    if (playback) playback.catch(() => {});
  } catch {
    // The poster remains available if the browser cannot play the video.
  }
}

let pageIsInactive = false;

function suspendVideos() {
  if (pageIsInactive) return;
  pageIsInactive = true;
  for (const clip of videoClips) {
    clip.resumeOnReturn = !clip.video.paused;
    clip.video.muted = true;
    if (clip.resumeOnReturn) clip.video.pause();
  }
}

function resumeVideos() {
  if (!pageIsInactive || document.hidden) return;
  pageIsInactive = false;
  for (const clip of videoClips) {
    if (clip.resumeOnReturn) playSilently(clip.video);
    clip.resumeOnReturn = false;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) suspendVideos();
  else resumeVideos();
});
window.addEventListener('pagehide', suspendVideos);
window.addEventListener('pageshow', resumeVideos);

// Playback starts only through the native controls. Keep one stream active.
for (const clip of videoClips) {
  clip.video.addEventListener('play', () => {
    for (const other of videoClips) {
      if (other !== clip) {
        other.resumeOnReturn = false;
        other.video.pause();
      }
    }
  });
}
