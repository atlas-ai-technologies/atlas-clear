// Shared by the static build and the browser: one source for project markup.
export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const themeFor = id => ['nyulo', 'wishes'].includes(id) ? 'glamour' : 'atlas';
export const homePath = (lang, base = '/') => `${base}${lang}/`;
export const projectPath = (id, lang, base = '/') => `${homePath(lang, base)}projects/${encodeURIComponent(id)}/`;
export const assetPath = (path, base = '/') => path.startsWith(base) ? path : base + path.replace(/^\/+/, '');

export function verifiedDownload(project) {
  const download = project.download;
  if (!download?.verified) return null;
  try {
    const url = new URL(download.url);
    return url.protocol === 'https:' && url.hostname === 'apps.microsoft.com'
      && !url.username && !url.password && url.pathname === `/detail/${download.productId}` ? url.href : null;
  } catch { return null; }
}

export function imageMarkup(project, index, lang, t, base = '/', detail = false) {
  if (project.image) {
    const image = project.image;
    const caption = image.caption?.[lang] || t.characterArt;
    return `<figure class="project-visual ${image.kind === 'screenshot' ? 'screenshot' : ''}"><picture>
      ${image.optimizedSrc ? `<source type="image/webp" srcset="${escapeHtml(assetPath(image.optimizedSrc, base))}">` : ''}
      <img src="${escapeHtml(assetPath(image.src, base))}" alt="${escapeHtml(image.alt[lang])}"
        loading="${detail ? 'eager' : 'lazy'}" decoding="async" width="${image.width || 1086}" height="${image.height || 1448}">
      </picture><figcaption>${escapeHtml(caption)}</figcaption></figure>`;
  }
  return `<div class="art ${escapeHtml(project.color)}" aria-hidden="true">
    <span class="art-index">ATLAS / ${String(index + 1).padStart(2, '0')}</span>
    <span class="symbol">${escapeHtml(project.symbol)}</span>
    <span class="art-label">${escapeHtml(t.categories[project.category])} / ${escapeHtml(t.concept)}</span></div>`;
}

export function downloadMarkup(project, lang, t, detail = false) {
  const url = verifiedDownload(project);
  if (!url) return '';
  return `<div class="download-area"><a class="download-link" href="${escapeHtml(url)}" rel="external"
    aria-label="${escapeHtml(t.download + ': ' + project.name)}"><span>${escapeHtml(t.download)}</span><span aria-hidden="true">↓</span></a>
    ${detail ? `<p class="disclosure">${escapeHtml(t.downloadNote)}</p><p class="disclosure">${escapeHtml(t.availability)}: <time datetime="${project.download.verifiedAt}">${project.download.verifiedAt}</time></p>` : ''}</div>`;
}

export function cardMarkup(project, index, lang, t, base = '/') {
  return `<article class="card ${themeFor(project.id) === 'glamour' ? 'card-glamour' : ''}" data-project="${project.id}">
    ${imageMarkup(project, index, lang, t, base)}<div class="card-body">
      <div class="card-meta"><span class="badge ${project.status}">${escapeHtml(t[project.status])}</span>
        <span>${verifiedDownload(project) ? 'Microsoft Store' : project.version ? 'v' + escapeHtml(project.version) : 'ATLAS'}</span></div>
      <h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.description[lang])}</p>
      ${downloadMarkup(project, lang, t)}
      <a class="card-link" href="${projectPath(project.id, lang, base)}"><span>${escapeHtml(t.details)}<span class="sr-only">: ${escapeHtml(project.name)}</span></span><span aria-hidden="true">↗</span></a>
    </div></article>`;
}

export function detailMarkup(project, index, lang, t, updated, base = '/') {
  if (!project) return `<h1 tabindex="-1">${escapeHtml(t.notFound)}</h1><a class="text-link" href="${homePath(lang, base)}">${escapeHtml(t.back)}</a>`;
  return `<a class="text-link" href="${homePath(lang, base)}#projects">${escapeHtml(t.back)}</a>
    <h1 tabindex="-1">${escapeHtml(project.name)}</h1><p class="lead">${escapeHtml(project.description[lang])}</p>
    ${imageMarkup(project, index, lang, t, base, true)}
    <dl class="facts"><div><dt>${escapeHtml(t.status)}</dt><dd>${escapeHtml(t[project.status])}</dd></div>
      <div><dt>${escapeHtml(verifiedDownload(project) ? t.localVersion : t.version)}</dt><dd>${escapeHtml(project.version || t.pending)}</dd></div>
      <div><dt>${escapeHtml(t.updated)}</dt><dd><time datetime="${updated}">${updated}</time></dd></div></dl>
    <div class="project-notes"><section><h2>${escapeHtml(t.projectFocus)}</h2><p>${escapeHtml(project.detail[lang])}</p></section>
      <section><h2>${escapeHtml(t.intendedFor)}</h2><p>${escapeHtml(project.audience[lang])}</p></section>
      <section><h2>${escapeHtml(t.nextStep)}</h2><p>${escapeHtml(project.next[lang])}</p></section></div>
    ${downloadMarkup(project, lang, t, true)}
    <p class="disclosure">${escapeHtml(t.source)}</p><p class="disclosure">${escapeHtml(t.disclosure)}</p>
    <a class="primary" href="${homePath(lang, base)}#projects">${escapeHtml(t.backProjects)} ↗</a>`;
}
