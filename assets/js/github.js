/**
 * github.js
 * Integração com a GitHub REST API para listar repositórios automaticamente
 * na seção de Projetos. A função abaixo é chamada por assets/js/projects.js.
 */

const GITHUB_USERNAME = 'joao-torre';

const FEATURED_REPOS = [
  'Credit-Recovery-Curve',
  'Performance-Analytics',
  'Financial-Anomaly-Detection'
];

/**
 * Busca os repositórios públicos do usuário, ordenados por atualização mais recente.
 * @returns {Promise<Array>} lista de repositórios já filtrada (sem forks) e mapeada
 */
async function fetchGithubRepos() {
  const endpoint = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=12`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`GitHub API respondeu ${response.status}`);

    const repos = await response.json();

    return repos
      .filter((repo) => !repo.fork && FEATURED_REPOS.includes(repo.name))
      .sort((a, b) => FEATURED_REPOS.indexOf(a.name) - FEATURED_REPOS.indexOf(b.name))
      .map((repo) => ({
        name: repo.name,
        description: repo.description || 'Sem descrição.',
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        updatedAt: repo.updated_at,
      }));
  } catch (error) {
    console.error('[github.js] Falha ao buscar repositórios:', error);
    return null;
  }
}
