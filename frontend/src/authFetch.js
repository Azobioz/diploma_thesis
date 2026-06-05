let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (newToken) => {
    refreshSubscribers.forEach(cb => cb(newToken));
    refreshSubscribers = [];
};

const addRefreshSubscriber = (cb) => {
    refreshSubscribers.push(cb);
};

const refreshTokens = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await fetch('http://localhost:8081/boardiox/auth/refresh', {
        method: 'POST',
        headers: { 'X-Refresh-Token': refreshToken },
    });

    if (!response.ok) {
        throw new Error('Refresh failed');
    }

    const data = await response.json();
    const newAccessToken = data.tokenResponse?.accessToken;
    const newRefreshToken = data.refreshToken;

    if (!newAccessToken) throw new Error('No access token in response');

    localStorage.setItem('accessToken', newAccessToken);
    if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

    return newAccessToken;
};

const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('accessToken');

    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status !== 401) {
        return response;
    }

    // Если 401, то нужно обновить токен
    if (isRefreshing) {
        // Ждём пока текущий refresh завершится
        return new Promise((resolve, reject) => {
            addRefreshSubscriber(async (newToken) => {
                try {
                    const retryHeaders = {
                        ...options.headers,
                        Authorization: `Bearer ${newToken}`,
                    };
                    resolve(await fetch(url, { ...options, headers: retryHeaders }));
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    isRefreshing = true;
    try {
        const newToken = await refreshTokens();
        isRefreshing = false;
        onRefreshed(newToken);

        // Повторяем оригинальный запрос с новым токеном
        const retryHeaders = {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
        };
        return fetch(url, { ...options, headers: retryHeaders });
    } catch (err) {
        isRefreshing = false;
        refreshSubscribers = [];
        // Refresh не удался значит редирект на авторизацию
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        window.location.href = '/boardiox/auth';
        throw err;
    }
};

export default authFetch;
