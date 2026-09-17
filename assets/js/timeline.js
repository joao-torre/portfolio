/**
 * timeline.js
 * Busca data/experience.json e renderiza a timeline vertical na seção #experience.
 * Requer que o site seja servido por HTTP (fetch falha em file:// por CORS) —
 * ver "Rodando localmente" no README.
 */

(function () {
  const list = document.querySelector('[data-timeline]');
  if (!list) return;

  async function loadExperience() {
    try {
      const response = await fetch('data/experience.json?v=8', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Falha ao carregar experience.json (${response.status})`);

      const experiences = await response.json();
      render(experiences);
    } catch (error) {
      // Mantém o conteúdo estático que já está no HTML — melhor uma timeline
      // sem atualização dinâmica do que uma seção vazia.
      console.error('[timeline.js]', error);
    }
  }

  function render(experiences) {
    // Escapa tudo que vem do JSON antes de ir para innerHTML
    const esc = window.portfolioDom?.escapeHtml || ((v) => String(v ?? ''));

    list.innerHTML = experiences
      .map((exp, index) => {
        const lang = window.portfolioI18n?.getLanguage() || 'pt';
        const localized = exp[lang] || exp.pt || exp;
        const stack = Array.isArray(exp.stack) ? exp.stack : [];
        const highlightList = Array.isArray(localized.highlights) ? localized.highlights : [];
        const stackTags = stack.map((s) => `<span class="tag">${esc(s)}</span>`).join('');
        const highlights = highlightList.map((h) => `<li>${esc(h)}</li>`).join('');

        return `
          <li class="timeline__item${exp.current ? ' timeline__item--current' : ''}" data-reveal data-reveal-delay="${index * 80}">
            <div class="timeline__meta">
              <span>${esc(localized.period)}</span>
              <span>·</span>
              <span>${esc(exp.location)}</span>
              ${exp.current ? `<span class="timeline__badge">${esc(window.portfolioI18n?.t('dynamic.current') || 'Atual')}</span>` : ''}
            </div>
            <h3 class="timeline__role">${esc(localized.role)}</h3>
            <p class="timeline__company">${esc(exp.company)}</p>
            ${localized.summary ? `<p class="timeline__summary">${esc(localized.summary)}</p>` : ''}
            <ul class="timeline__highlights">${highlights}</ul>
            <div class="timeline__stack">${stackTags}</div>
          </li>
        `;
      })
      .join('');

    // Reaplica o observer de reveal aos itens recém-inseridos
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = el.getAttribute('data-reveal-delay') || 0;
            el.style.setProperty('--delay', `${delay}ms`);
            el.classList.add('reveal', 'is-visible');
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    list.querySelectorAll('[data-reveal]').forEach((el) => {
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  document.addEventListener('DOMContentLoaded', loadExperience);
  window.addEventListener('languagechange', loadExperience);
})();
