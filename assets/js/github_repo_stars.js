const githubRepoStarElements = document.querySelectorAll('[data-github-repo-stars]');

const parseGitHubRepo = (url) => {
    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname.toLowerCase();
        if (hostname !== 'github.com' && hostname !== 'www.github.com') {
            return null;
        }

        const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
        if (pathParts.length < 2) {
            return null;
        }

        const owner = pathParts[0];
        const repo = pathParts[1].replace(/\.git$/, '');
        if (!owner || !repo) {
            return null;
        }

        return `${owner}/${repo}`;
    } catch (_) {
        return null;
    }
};

const formatGitHubStars = (count) => {
    if (!Number.isFinite(count)) {
        return '';
    }

    return parseInt(count, 10).toLocaleString();
};

const githubRepoStars = new Set();
githubRepoStarElements.forEach(element => {
    const repo = parseGitHubRepo(element.getAttribute('data-github-repo-url') || element.getAttribute('href'));
    if (repo) {
        const normalizedRepo = repo.toLowerCase();
        element.setAttribute('data-github-repo-stars', normalizedRepo);
        githubRepoStars.add(normalizedRepo);
    }
});

const getGitHubStarsFromCache = (repo) => {
    const cachedData = localStorage.getItem(`githubRepoStars:${repo}`);
    if (!cachedData) {
        return null;
    }

    try {
        const { stars, timestamp } = JSON.parse(cachedData);
        if (!Number.isFinite(stars) || !Number.isFinite(timestamp)) {
            return null;
        }

        return { stars, timestamp };
    } catch (_) {
        return null;
    }
};

const showGitHubRepoStars = () => {
    githubRepoStars.forEach(repo => {
        const cachedData = getGitHubStarsFromCache(repo);
        if (!cachedData) {
            return;
        }

        const elements = document.querySelectorAll(`[data-github-repo-stars="${repo}"]`);
        elements.forEach(element => {
            element.innerHTML = `<i class="fa-brands fa-github" aria-hidden="true"></i><span>${formatGitHubStars(cachedData.stars)} <i class="fa-solid fa-star github-stars-icon" aria-hidden="true"></i></span>`;
            element.setAttribute('aria-label', `${formatGitHubStars(cachedData.stars)} GitHub stars`);
            element.classList.add('is-loaded');
        });
    });
};

const uncachedGitHubRepos = [];
githubRepoStars.forEach(repo => {
    const cachedData = getGitHubStarsFromCache(repo);
    if (!cachedData || Date.now() - cachedData.timestamp > 12 * 60 * 60 * 1000) {
        uncachedGitHubRepos.push(repo);
    }
});

showGitHubRepoStars();

if (uncachedGitHubRepos.length > 0) {
    Promise.all(uncachedGitHubRepos.map(repo => {
        return fetch(`https://api.github.com/repos/${repo}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`GitHub API returned ${response.status} for ${repo}`);
                }

                return response.json();
            })
            .then(data => {
                const cacheData = {
                    stars: data.stargazers_count,
                    timestamp: Date.now()
                };
                localStorage.setItem(`githubRepoStars:${repo}`, JSON.stringify(cacheData));
            });
    })).catch(error => {
        console.error('Error fetching GitHub repository stars:', error);
    }).finally(showGitHubRepoStars);
}
