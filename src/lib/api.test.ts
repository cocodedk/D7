import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api, fileToBase64, compressImage } from './api'

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('api.get', () => {
    it('should make GET request with authentication token', async () => {
      localStorage.setItem('auth_token', 'test-token')
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      })

      const result = await api.get('/test')

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
      })
      expect(result).toEqual({ data: 'test' })
    })

    it('should make GET request without authentication token', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      })

      const result = await api.get('/test')

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual({ data: 'test' })
    })
  })

  describe('api.post', () => {
    it('should make POST request with data', async () => {
      localStorage.setItem('auth_token', 'test-token')
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: '1' }),
      })

      const result = await api.post('/test', { name: 'Test' })

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({ name: 'Test' }),
      })
      expect(result).toEqual({ id: '1' })
    })

    it('should make POST request without data', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await api.post('/test')

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      })
      expect(result).toEqual({ success: true })
    })
  })

  describe('api.put', () => {
    it('should make PUT request with data', async () => {
      localStorage.setItem('auth_token', 'test-token')
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ updated: true }),
      })

      const result = await api.put('/test/1', { name: 'Updated' })

      expect(fetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({ name: 'Updated' }),
      })
      expect(result).toEqual({ updated: true })
    })
  })

  describe('api.delete', () => {
    it('should make DELETE request', async () => {
      localStorage.setItem('auth_token', 'test-token')
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ deleted: true }),
      })

      const result = await api.delete('/test/1')

      expect(fetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
      })
      expect(result).toEqual({ deleted: true })
    })
  })

  describe('error handling', () => {
    it('should handle 401 error and redirect to login', async () => {
      const originalLocation = window.location
      delete (window as any).location
      window.location = { ...originalLocation, href: '' } as Location

      localStorage.setItem('auth_token', 'test-token')
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })

      await expect(api.get('/test')).rejects.toThrow()
      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(window.location.href).toBe('/login')

      window.location = originalLocation
    })

    it('should handle other HTTP error codes', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      })

      await expect(api.get('/test')).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(api.get('/test')).rejects.toThrow('Network error')
    })

    it('should handle JSON parse errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      await expect(api.get('/test')).rejects.toThrow()
    })
  })
})

describe('fileToBase64', () => {
  it('should convert file to base64 string', async () => {
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    const result = await fileToBase64(file)

    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    // Should be base64 without data URL prefix
    expect(result).not.toContain('data:image/jpeg;base64,')
  })

  it('should handle FileReader error', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const originalFileReader = global.FileReader

    global.FileReader = class FileReader {
      readAsDataURL() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror({} as ProgressEvent<FileReader>)
          }
        }, 0)
      }
    } as any

    await expect(fileToBase64(file)).rejects.toBeDefined()

    global.FileReader = originalFileReader
  })
})

describe('compressImage', () => {
  it('should compress large images (>1200px)', async () => {
    const largeImage = new File(['large'], 'large.jpg', { type: 'image/jpeg' })

    // Mock Image with large dimensions
    const originalImage = global.Image
    global.Image = class Image {
      width = 2000
      height = 1500
      onload: (() => void) | null = null
      src = ''
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
    } as any

    const result = await compressImage(largeImage)

    expect(result).toBeInstanceOf(File)
    expect(result.name).toBe('large.jpg')
    expect(result.type).toBe('image/jpeg')

    global.Image = originalImage
  })

  it('should handle small images (<1200px)', async () => {
    const smallImage = new File(['small'], 'small.jpg', { type: 'image/jpeg' })

    const originalImage = global.Image
    global.Image = class Image {
      width = 800
      height = 600
      onload: (() => void) | null = null
      src = ''
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
    } as any

    const result = await compressImage(smallImage)

    expect(result).toBeInstanceOf(File)
    expect(result.type).toBe('image/jpeg')

    global.Image = originalImage
  })

  it('should maintain aspect ratio', async () => {
    const image = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    const originalImage = global.Image
    let canvasWidth = 0
    let canvasHeight = 0

    global.Image = class Image {
      width = 2000
      height = 1000 // 2:1 aspect ratio
      onload: (() => void) | null = null
      src = ''
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
    } as any

    const originalGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
      createImageData: vi.fn(),
      setTransform: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
    })

    Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
      set(value) {
        canvasWidth = value
      },
      get() {
        return canvasWidth
      },
    })

    Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
      set(value) {
        canvasHeight = value
      },
      get() {
        return canvasHeight
      },
    })

    await compressImage(image)

    // Aspect ratio should be maintained (2:1)
    const aspectRatio = canvasWidth / canvasHeight
    expect(aspectRatio).toBeCloseTo(2, 1)

    global.Image = originalImage
    HTMLCanvasElement.prototype.getContext = originalGetContext
  })
})
