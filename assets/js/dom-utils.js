/**
 * dom-utils.js
 * Helpers compartilhados de segurança para os módulos que montam HTML
 * dinamicamente (timeline.js, projects.js, certifications.js).
 *
 * Motivo: todos esses módulos escrevem em innerHTML a partir de fontes
 * externas (data/*.json e a GitHub API). Sem escape, qualquer caractere
 * especial vindo dessas fontes é interpretado como marcação — na melhor
 * hipótese quebra o layout, na pior permite injeção de HTML/script.
 * Precisa ser carregado ANTES dos demais scripts.
 */

(function () {
  const ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  /**
   * Escapa texto para interpolação segura em innerHTML.
   * @param {*} value
   * @returns {string}
   */
  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, (char) => ENTITIES[char]);
  }

  /**
   * Valida uma URL antes de usá-la em href/src.
   * Aceita apenas caminhos relativos e http(s) — bloqueia javascript:, data:,
   * vbscript: e afins.
   * @param {*} value
   * @returns {string} URL escapada, ou string vazia se não for segura
   */
  function safeUrl(value) {
    if (!value) return '';
    const raw = String(value).trim();
    if (/^(https?:)?\/\//i.test(raw) || /^[\w./-]+$/.test(raw)) {
      return escapeHtml(raw);
    }
    return '';
  }

  /**
   * Fallback de logo sem handler inline (inline onerror é bloqueado por CSP).
   * Substitui a <img> quebrada por um badge com as iniciais.
   * @param {ParentNode} scope raiz onde procurar as imagens
   */
  function bindLogoFallbacks(scope) {
    const root = scope || document;
    root.querySelectorAll('img[data-logo-fallback]').forEach((img) => {
      const apply = () => {
        const parent = img.parentElement;
        if (!parent) return;
        const badge = document.createElement('span');
        badge.textContent = img.getAttribute('data-logo-fallback') || '?';
        parent.classList.add('cert-card__logo--fallback');
        img.replaceWith(badge);
      };

      img.addEventListener('error', apply, { once: true });

      // Se a imagem já falhou antes do listener ser registrado
      if (img.complete && img.naturalWidth === 0) apply();
    });
  }

  window.portfolioDom = { escapeHtml, safeUrl, bindLogoFallbacks };

  // Cobre os logos que já vêm no HTML estático (fallback pré-JS).
  document.addEventListener('DOMContentLoaded', () => bindLogoFallbacks(document));
})();
