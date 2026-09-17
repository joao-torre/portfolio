/**
 * certifications.js
 * Busca data/certifications.json e renderiza cards premium. Se o logo da
 * instituição não existir em assets/images/logos, cai automaticamente para
 * um badge com as iniciais — nunca mostra ícone de imagem quebrada.
 */

(function () {
  const grid = document.querySelector('[data-certifications]');
  if (!grid) return;

  function initials(name) {
    return name
      .split(' ')
      .filter((w) => w.length > 2 || w === w.toUpperCase())
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  async function loadCertifications() {
    try {
      const response = await fetch('data/certifications.json');
      if (!response.ok) throw new Error(`Falha ao carregar certifications.json (${response.status})`);
      const certifications = await response.json();
      render(certifications);
    } catch (error) {
      // Preserva os cards estáticos já presentes no HTML em vez de esvaziar a seção.
      console.error('[certifications.js]', error);
    }
  }

  function render(certifications) {
    const esc = window.portfolioDom?.escapeHtml || ((v) => String(v ?? ''));
    const url = window.portfolioDom?.safeUrl || (() => '');

    grid.innerHTML = certifications
      .map((cert, index) => {
        const badgeInitials = esc(initials(cert.institution));
        const lang = window.portfolioI18n?.getLanguage() || 'pt';
        const category = lang === 'en' ? (cert.enCategory || cert.category) : (cert.ptCategory || cert.category);
        const title = lang === 'en' ? (cert.enTitle || cert.title) : (cert.ptTitle || cert.title);
        const logo = url(cert.logo);
        const institutionUrl = url(cert.institutionUrl);
        const credentialUrl = url(cert.credentialUrl);

        return `
          <article class="cert-card" data-reveal data-reveal-delay="${index * 70}">
            <div class="cert-card__header">
              <div class="cert-card__logo" data-fallback="${badgeInitials}">
                ${logo ? `<img src="${logo}" alt="${esc(cert.institution)}" loading="lazy" data-logo-fallback="${badgeInitials}" />` : `<span>${badgeInitials}</span>`}
              </div>
              ${cert.hours ? `<span class="tag cert-card__hours">${esc(cert.hours)}h</span>` : ''}
            </div>
            <h3 class="cert-card__title">${esc(title)}</h3>
            ${institutionUrl ? `<p class="cert-card__institution"><a href="${institutionUrl}" target="_blank" rel="noopener noreferrer"><strong>${esc(cert.institution)}</strong></a></p>` : `<p class="cert-card__institution">${esc(cert.institution)}</p>`}
            <span class="cert-card__category mono">${esc(category)}</span>
            ${credentialUrl ? `<a href="${credentialUrl}" target="_blank" rel="noopener noreferrer" class="cert-card__link">${esc(window.portfolioI18n?.t("dynamic.viewCredential") || "Ver credencial →")}</a>` : ''}
          </article>
        `;
      })
      .join('');

    window.portfolioDom?.bindLogoFallbacks(grid);

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
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    grid.querySelectorAll('[data-reveal]').forEach((el) => {
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  document.addEventListener('DOMContentLoaded', loadCertifications);
  window.addEventListener('languagechange', loadCertifications);
})();
