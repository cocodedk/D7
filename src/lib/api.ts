const API_BASE = (import.meta.env as { VITE_API_BASE?: string }).VITE_API_BASE || '/api'

async function getAuthToken(): Promise<string | null> {
  return localStorage.getItem('auth_token')
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuth: boolean = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (!skipAuth) {
    const token = await getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const url = `${API_BASE}${endpoint}`;
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:24',message:'API request',data:{endpoint,url,method:options.method||'GET'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
  // #endregion

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    // Don't redirect for login endpoint - let it handle its own errors
    const isLoginEndpoint = endpoint === '/auth-login'
    if (response.status === 401 && !skipAuth && !isLoginEndpoint) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    let errorMessage = `HTTP ${response.status}`
    try {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json()
        errorMessage = error.error || error.message || errorMessage
      } else {
        const text = await response.text()
        errorMessage = text || errorMessage
      }
    } catch {
      errorMessage = 'Request failed'
    }
    throw new Error(errorMessage)
  }

  const jsonData = await response.json();
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:54',message:'API response parsed',data:{endpoint,status:response.status,isArray:Array.isArray(jsonData),dataType:typeof jsonData,dataLength:Array.isArray(jsonData)?jsonData.length:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  return jsonData;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
  public: {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }, true),
  },
}

/**
 * Convert File to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Compress image before upload
 */
export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        const maxDimension = 1200
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width
          width = maxDimension
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height
          height = maxDimension
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          'image/jpeg',
          0.8
        )
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}
