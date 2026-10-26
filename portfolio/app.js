import {escapeHtml, themeFor, homePath, projectPath, cardMarkup, detailMarkup} from './site-core.mjs';

const $ = selector => document.querySelector(selector);
const basePath = new URL('.', import.meta.url).pathname;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let dictionaries, languages, content;
let category = 'all';
let motionPaused = false;
let route;

function readRoute() {
  const params = new URLSearchParams(location.search);
  const parts = location.pathname.slice(basePath.length).split('/').filter(Boolean);
  const requestedLanguage = params.get('lang') || parts[0];
  return {
    lang: Object.hasOwn(languages, requestedLanguage) ? requestedLanguage : 'en',
    projectId: params.get('project') || (parts[1] === 'projects' ? parts[2] : null)
  };
}

async function readJson(file) {
  const response = await fetch(new URL(file, import.meta.url));
  if (!response.ok) throw new Error(`Unable to load ${file}`);
  return response.json();
}

function renderMotion() {
  const t = dictionaries[route.lang];
  const paused = motionPaused || reducedMotion.matches;
  document.body.dataset.motion = paused ? 'paused' : 'running';
  const button = $('#motion-toggle');
  button.disabled = reducedMotion.matches;
  button.setAttribute('aria-pressed', String(paused));
  button.textContent = reducedMotion.matches ? t.motionReduced : paused ? t.resumeMotion : t.pauseMotion;
}

function renderCards() {
  const t = dictionaries[route.lang];
  const fold = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase(route.lang);
  const query = fold($('#search').value.trim());
  const status = $('#status').value;
  const matches = content.projects.filter(project =>
    (category === 'all' || project.category === category) &&
    (status === 'all' || project.status === status) &&
    fold(`${project.name} ${project.description[route.lang]} ${project.version} ${t.categories[project.category]}`).includes(query)
  );
  $('#count').textContent = `${matches.length} / ${content.projects.length} ${t.count}`;
  $('#cards').innerHTML = matches.length
    ? matches.map(project => cardMarkup(project, content.projects.indexOf(project), route.lang, t, basePath)).join('')
    : `<p class="empty">${escapeHtml(t.empty)}</p>`;
}

function updateMetadata(project) {
  const t = dictionaries[route.lang];
  document.title = (project ? project.name + ' — ' : '') + 'ATLAS AI Technologies' + (!route.projectId ? ' — ' + t.projects : '');
  const description = project ? project.description[route.lang] : t.intro;
  $('meta[name="description"]').content = description;
  $('meta[property="og:title"]').content = document.title;
  $('meta[property="og:description"]').content = description;
  $('meta[property="og:locale"]').content = languages[route.lang].locale;
  const canonical = $('link[rel="canonical"]');
  if (canonical) canonical.href = location.origin + (project ? projectPath(project.id, route.lang, basePath) : homePath(route.lang, basePath));
  const socialUrl = $('meta[property="og:url"]');
  if (socialUrl && canonical) socialUrl.content = canonical.href;
}

function render() {
  const t = dictionaries[route.lang];
  const project = content.projects.find(item => item.id === route.projectId);
  document.documentElement.lang = route.lang;
  document.body.dataset.theme = themeFor(route.projectId);
  document.querySelectorAll('[data-t]').forEach(element => { element.innerHTML = t[element.dataset.t]; });
  document.querySelectorAll('.brand').forEach(link => { link.href = homePath(route.lang, basePath); });
  document.querySelector('nav').setAttribute('aria-label', t.mainNav);
  $('.filters').setAttribute('aria-label', t.filterLabel);
  $('.orb-scene').setAttribute('aria-label', t.orbAlt);
  $('#search').placeholder = t.search;
  $('#search').setAttribute('aria-label', t.search);
  $('#language').value = route.lang;
  $('#language').setAttribute('aria-label', t.language);
  const status = $('#status').value || 'all';
  $('#status').innerHTML = ['all', 'store', 'development', 'prepared', 'unconfirmed']
    .map(value => `<option value="${value}">${escapeHtml(value === 'all' ? t.all + ' — ' + t.status : t[value])}</option>`).join('');
  $('#status').value = status;
  $('.filters').innerHTML = Object.entries(t.categories)
    .map(([key, label]) => `<button data-category="${key}" aria-pressed="${key === category}">${escapeHtml(label)}</button>`).join('');
  $('#timeline').innerHTML = t.stages.map(stage => `<article class="milestone"><small>${escapeHtml(stage[0])}</small><h3>${escapeHtml(stage[1])}</h3><p>${escapeHtml(stage[2])}</p></article>`).join('');
  document.querySelectorAll('header nav a').forEach(link => { link.href = homePath(route.lang, basePath) + new URL(link.href).hash; });
  document.querySelectorAll('.language-links a[hreflang]').forEach(link => {
    const code = link.hreflang;
    link.href = route.projectId ? projectPath(route.projectId, code, basePath) : homePath(code, basePath);
    if (code === route.lang) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  $('#home').hidden = Boolean(route.projectId);
  $('#detail').hidden = !route.projectId;
  if (route.projectId) $('#detail').innerHTML = detailMarkup(project, content.projects.indexOf(project), route.lang, t, content.updated, basePath);
  renderCards();
  renderMotion();
  updateMetadata(project);
}

try {
  [dictionaries, languages, content] = await Promise.all(['translations.json', 'languages.json', 'content.json'].map(readJson));
  route = readRoute();
  try { motionPaused = localStorage.getItem('atlas-motion-paused') === 'true'; } catch { /* Optional preference storage. */ }
  $('#language').innerHTML = Object.entries(languages).map(([code, info]) => `<option value="${code}">${escapeHtml(info.name)}</option>`).join('');
  $('#language').addEventListener('change', event => {
    route.lang = event.target.value;
    const path = route.projectId ? projectPath(route.projectId, route.lang, basePath) : homePath(route.lang, basePath);
    history.pushState(null, '', path + location.hash);
    render();
  });
  window.addEventListener('popstate', () => { route = readRoute(); render(); });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    category = button.dataset.category;
    render();
    document.querySelector(`[data-category="${category}"]`).focus();
  });
  $('#search').addEventListener('input', renderCards);
  $('#status').addEventListener('change', renderCards);
  $('#motion-toggle').addEventListener('click', () => {
    motionPaused = !motionPaused;
    try { localStorage.setItem('atlas-motion-paused', String(motionPaused)); } catch { /* Still works without storage. */ }
    renderMotion();
  });
  reducedMotion.addEventListener('change', renderMotion);
  render();
} catch (error) {
  $('#error').hidden = false;
  $('#error').textContent = dictionaries?.[route?.lang || 'en']?.loadError || 'The interactive controls could not load. The project links below remain available. Please reload to retry.';
  console.error(error);
}
