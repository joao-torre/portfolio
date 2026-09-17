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
  // per_page=100: com sort=updated e um limite baixo, um repositório destacado
  // some da listagem assim que 12 outros repos forem atualizados depois dele.
  const endpoint = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`;

  try {
    const response = await fetch(endpoint);
    // A API sem autenticação permite 60 requisições/hora por IP. Em rede
    // corporativa (IP compartilhado por NAT) o 403 acontece com facilidade —
    // por isso projects.js precisa ter um fallback local.
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
