const DEFAULT_URL = import.meta.env.DEV ? '/api/v1' : 'http://127.0.0.1:4000/api/v1';
const API_BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_URL;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
    details?: any;
  };
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('complejo_ub_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('complejo_ub_token', token);
    } else {
      localStorage.removeItem('complejo_ub_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    let isTimedOut = false;
    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      try {
        controller.abort();
      } catch {
        // ignore
      }
    }, 35000);

    try {
      let response: Response;
      try {
        response = await fetch(url, {
          ...options,
          headers,
          signal: options.signal || controller.signal,
        });
        if (response.status === 404 && API_BASE_URL.startsWith('/')) {
          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            const directUrl = `http://127.0.0.1:4000${url}`;
            response = await fetch(directUrl, {
              ...options,
              headers,
              signal: options.signal || controller.signal,
            });
          }
        }
      } catch (networkErr: any) {
        if (isTimedOut || controller.signal.aborted) {
          throw networkErr;
        }

        if (API_BASE_URL.startsWith('/')) {
          const directUrl = `http://127.0.0.1:4000${url}`;
          response = await fetch(directUrl, {
            ...options,
            headers,
            signal: options.signal || controller.signal,
          });
        } else {
          throw networkErr;
        }
      } finally {
        clearTimeout(timeoutId);
      }

      let json: ApiResponse<T>;
      try {
        json = await response.json();
      } catch {
        json = {
          success: response.ok,
          error: {
            message: `Respuesta no estructurada del servidor (${response.status})`,
            statusCode: response.status,
          },
        };
      }

      if (!response.ok || !json.success) {
        if (response.status === 401) {
          this.setToken(null);
        }
        const errorMsg = json.error?.message || `Error en la solicitud HTTP (${response.status})`;
        const errorObj: any = new Error(errorMsg);
        errorObj.statusCode = response.status;
        errorObj.details = json.error?.details || null;
        throw errorObj;
      }

      return json.data as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (
        isTimedOut ||
        err?.name === 'AbortError' ||
        String(err?.message || '').toLowerCase().includes('abort') ||
        String(err?.message || '').toLowerCase().includes('signal is aborted')
      ) {
        const timeoutError: any = new Error(
          'El servidor tardó en responder o está iniciando su servicio en la nube. Por favor, aguarda unos segundos y reintenta.'
        );
        timeoutError.statusCode = 504;
        throw timeoutError;
      }

      console.warn(`[ApiClient] Solicitud a ${endpoint} falló (${err.message}).`);
      throw err;
    }
  }

  get<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T = any>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
