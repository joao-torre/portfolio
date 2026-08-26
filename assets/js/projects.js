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
    const hasCurated = Boolean(curated);
    const image = curated?.image
      ? `<div class="project-card__image" style="background-image: url('${curated.image}')"></div>`
      : `<div class="project-card__image project-card__image--placeholder"><span class="mono">${repo.name}</span></div>`;

    const stack = curated?.stack?.length
      ? curated.stack
      : [repo.language].filter(Boolean);

    const stackTags = stack.map((s) => `<span class="tag">${s}</span>`).join('');

    const lang = window.portfolioI18n?.getLanguage() || 'pt';
    const localized = hasCurated ? (curated[lang] || curated.pt || curated.en || {}) : {};

    const details = hasCurated
      ? `
        ${localized.objective ? `<p class="project-card__row"><strong>${window.portfolioI18n?.t("dynamic.objective") || "Objetivo:"}</strong> ${localized.objective}</p>` : ''}
        ${localized.challenges ? `<p class="project-card__row"><strong>${window.portfolioI18n?.t("dynamic.challenges") || "Desafios:"}</strong> ${localized.challenges}</p>` : ''}
        ${localized.learnings ? `<p class="project-card__row"><strong>${window.portfolioI18n?.t("dynamic.learnings") || "Aprendizados:"}</strong> ${localized.learnings}</p>` : ''}
      `
      : `<p class="project-card__row">${repo.description}</p>`;

    return `
      <article class="project-card" data-reveal>
        ${image}
        <div class="project-card__body">
          <h3 class="project-card__title">${curated?.title || repo.name}</h3>
          <div class="project-card__stack">${stackTags}</div>
          <div class="project-card__details">${details}</div>
          <div class="project-card__footer">
            ${repo.stars ? `<span class="mono project-card__stars">★ ${repo.stars}</span>` : '<span></span>'}
            <a href="${repo.url}" target="_blank" rel="noopener noreferrer" class="btn btn--ghost btn--sm">${window.portfolioI18n?.t("dynamic.viewGithub") || "Ver no GitHub"}</a>
          </div>
        </div>
      </article>
    `;
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

    if (repos === null) {
      errorState();
      return;
    }

    if (repos.length === 0) {
      emptyState();
      return;
    }

    grid.innerHTML = repos
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
