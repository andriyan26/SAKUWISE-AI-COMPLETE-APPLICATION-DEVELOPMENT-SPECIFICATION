// Determine API base URL dynamically
const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    // When deployed on live production domain (not localhost)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${origin}/api/v1`;
    }
  }
  return 'http://localhost:5000/api/v1';
};

const BASE_URL = getBaseUrl();

export class ApiError extends Error {
  statusCode: number;
  errors?: any[];

  constructor(message: string, statusCode = 500, errors?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('sakuwise_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Includes HTTP-only cookies
    });
  } catch (netErr: any) {
    throw new ApiError(
      'Tidak dapat terhubung ke server API backend. Pastikan server hosting dan database Anda aktif.',
      0
    );
  }

  // Parse JSON response safely
  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    // If response is text / HTML
    const textData = await response.text().catch(() => '');
    try {
      data = JSON.parse(textData);
    } catch (_) {
      data = null;
    }
  }

  if (!response.ok) {
    let errorMsg = 'Terjadi kesalahan pada permintaan server.';
    if (data?.message) {
      errorMsg = data.message;
    } else if (response.status === 400) {
      errorMsg = 'Data yang dikirim tidak valid. Periksa kembali form input Anda.';
    } else if (response.status === 401) {
      errorMsg = 'Email atau kata sandi tidak cocok. Silakan coba lagi.';
    } else if (response.status === 404) {
      errorMsg = 'Endpoint server API tidak ditemukan (404). Pastikan backend aktif di hosting Anda.';
    } else if (response.status === 500) {
      errorMsg = 'Terjadi kesalahan internal pada server database (500).';
    } else if (response.status === 502 || response.status === 503) {
      errorMsg = 'Server backend sedang tidak aktif atau tidak dapat dihubungi (502/503).';
    } else {
      errorMsg = `Permintaan gagal dengan status ${response.status}.`;
    }

    throw new ApiError(errorMsg, response.status, data?.errors);
  }

  if (data === null || typeof data !== 'object') {
    throw new ApiError(
      'Server tidak mengembalikan respons JSON yang valid. Pastikan backend API sudah aktif.',
      502
    );
  }

  return data;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  upload: <T = any>(endpoint: string, formData: FormData, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
