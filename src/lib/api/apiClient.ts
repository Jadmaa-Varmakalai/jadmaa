export const API_BASE_URL = '/api/v1';

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const fetchApi = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  let token = localStorage.getItem('jadmaa_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'same-origin',
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register') && !endpoint.includes('/auth/refresh')) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        return fetchApi(endpoint, options);
      }).catch(err => {
        return Promise.reject(err);
      });
    }

    isRefreshing = true;

    try {
      const storedRefreshToken = localStorage.getItem('jadmaa_refresh_token');
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(storedRefreshToken ? { 'x-refresh-token': storedRefreshToken } : {})
        },
        credentials: 'same-origin',
        body: JSON.stringify({ refreshToken: storedRefreshToken })
      });

      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok) {
        throw new Error(refreshData.error?.message || 'Refresh failed');
      }

      const newToken = refreshData.data?.token;
      if (newToken) {
        localStorage.setItem('jadmaa_token', newToken);
      }
      if (refreshData.data?.refreshToken) {
        localStorage.setItem('jadmaa_refresh_token', refreshData.data.refreshToken);
      }
      
      processQueue(null, newToken);

      // Retry the original request
      return fetchApi(endpoint, options);
    } catch (err: any) {
      processQueue(err, null);
      localStorage.removeItem('jadmaa_token');
      localStorage.removeItem('jadmaa_refresh_token');
      const responseData = await response.json().catch(() => ({}));
      throw new Error(responseData.error?.message || 'Invalid or expired token');
    } finally {
      isRefreshing = false;
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err: any = new Error(data.error?.message || 'Something went wrong');
    err.data = data;
    throw err;
  }

  return data;
};
