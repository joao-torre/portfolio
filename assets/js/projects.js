/**
 * projects.js
 * Fonte primária: GitHub API (via fetchGithubRepos, definida em github.js) —
 * é isso que torna a seção automática: todo repositório público novo aparece
 * aqui sem precisar tocar em código.
 *
 * Fonte secundária (opcional): data/projects.json. Se um repositório tiver
 * uma entrada lá com o mesmo campo "repo", o card ganha objetivo, desafios,
 * aprendizados e imagem de capa — sem isso, o card ainda é renderizado, só
 * que mais enxuto (nome, descrição, linguagem, estrelas, link).
 */

(function () {
  const grid = document.querySelector('[data-projects]');
  if (!grid) return;

  async function loadCuratedData() {
    try {
      const response = await fetch('data/projects.json');
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data.filter((p) => p.repo) : [];
    } catch {
      return [];
    }
  }

  function projectCard(repo, curated) {
    const esc = window.portfolioDom?.escapeHtml || ((v) => String(v ?? ''));
    const url = window.portfolioDom?.safeUrl || (() => '');

    const hasCurated = Boolean(curated);
    const coverImage = url(curated?.image);
    const image = coverImage
      ? `<div class="project-card__image" style="background-image: url('${coverImage}')"></div>`
      : `<div class="project-card__image project-card__image--placeholder"><span class="mono">${esc(repo.name)}</span></div>`;

    const stack = curated?.stack?.length
      ? curated.stack
      : [repo.language].filter(Boolean);

    const stackTags = stack.map((s) => `<span class="tag">${esc(s)}</span>`).join('');

    const lang = window.portfolioI18n?.getLanguage() || 'pt';
    const localized = hasCurated ? (curated[lang] || curated.pt || curated.en || {}) : {};

    const details = hasCurated
      ? `
        ${localized.objective ? `<p class="project-card__row"><strong>${esc(window.portfolioI18n?.t("dynamic.objective") || "Objetivo:")}</strong> ${esc(localized.objective)}</p>` : ''}
        ${localized.challenges ? `<p class="project-card__row"><strong>${esc(window.portfolioI18n?.t("dynamic.challenges") || "Desafios:")}</strong> ${esc(localized.challenges)}</p>` : ''}
        ${localized.learnings ? `<p class="project-card__row"><strong>${esc(window.portfolioI18n?.t("dynamic.learnings") || "Aprendizados:")}</strong> ${esc(localized.learnings)}</p>` : ''}
      `
      : `<p class="project-card__row">${esc(repo.description)}</p>`;

    const repoUrl = url(repo.url) || `https://github.com/joao-torre/${encodeURIComponent(repo.name)}`;

    return `
      <article class="project-card" data-reveal>
        ${image}
        <div class="project-card__body">
          <h3 class="project-card__title">${esc(curated?.title || repo.name)}</h3>
          <div class="project-card__stack">${stackTags}</div>
          <div class="project-card__details">${details}</div>
          <div class="project-card__footer">
            ${repo.stars ? `<span class="mono project-card__stars">★ ${esc(repo.stars)}</span>` : '<span></span>'}
            <a href="${repoUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--ghost btn--sm">${esc(window.portfolioI18n?.t("dynamic.viewGithub") || "Ver no GitHub")}</a>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Converte as entradas curadas de projects.json no mesmo formato devolvido
   * pela GitHub API. Usado quando a API falha (rate limit de 60 req/h por IP,
   * rede corporativa, GitHub fora do ar) — assim a seção nunca fica vazia.
   */
  function reposFromCurated(curatedList) {
    return curatedList.map((c) => ({
      name: c.repo,
      description: c.title || c.repo,
      url: `https://github.com/joao-torre/${c.repo}`,
      language: c.stack?.[0] || null,
      stars: 0,
    }));
  }

  function emptyState() {
    grid.innerHTML = `
      <div class="projects-empty">
        <p>${window.portfolioI18n?.t("dynamic.emptyProjects") || "Nenhum repositório público encontrado ainda. Novos projetos aparecem aqui automaticamente assim que publicados no"}
          <a href="https://github.com/joao-torre" target="_blank" rel="noopener noreferrer" class="inline-link">GitHub</a>.
        </p>
      </div>
    `;
  }

  function errorState() {
    grid.innerHTML = `
      <div class="projects-empty">
        <p>${window.portfolioI18n?.t("dynamic.errorProjects") || "Não foi possível carregar os projetos do GitHub agora."}
          <a href="https://github.com/joao-torre" target="_blank" rel="noopener noreferrer" class="inline-link">github.com/joao-torre</a>.
        </p>
      </div>
    `;
  }

  async function init() {
    const [repos, curatedList] = await Promise.all([
      typeof fetchGithubRepos === 'function' ? fetchGithubRepos() : Promise.resolve(null),
      loadCuratedData(),
    ]);

    // Se a GitHub API falhou ou não devolveu nenhum dos repositórios
    // destacados, cai para os dados curados locais em vez de mostrar erro.
    let effectiveRepos = repos;

    if ((repos === null || repos.length === 0) && curatedList.length > 0) {
      effectiveRepos = reposFromCurated(curatedList);
    }

    if (effectiveRepos === null) {
      errorState();
      return;
    }

    if (effectiveRepos.length === 0) {
      emptyState();
      return;
    }

    grid.innerHTML = effectiveRepos
      .map((repo) => {
        const curated = curatedList.find((c) => c.repo === repo.name);
        return projectCard(repo, curated);
      })
      .join('');

    // Ativa o reveal-on-scroll para os cards recém-inseridos
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal', 'is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    grid.querySelectorAll('[data-reveal]').forEach((el) => {
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('languagechange', init);
})();
