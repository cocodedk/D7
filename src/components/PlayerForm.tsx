import { useState, FormEvent, useRef } from 'react'
import { Player } from '../hooks/usePlayers'
import { fileToBase64, compressImage } from '../lib/api'

interface PlayerFormProps {
  player?: Player
  onSave: (data: { name: string; nickname: string; avatar?: string }) => Promise<void>
  onCancel: () => void
}

export default function PlayerForm({ player, onSave, onCancel }: PlayerFormProps) {
  const [name, setName] = useState(player?.name || '')
  const [nickname, setNickname] = useState(player?.nickname || '')
  const [avatar, setAvatar] = useState<string | null>(player?.avatar || null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const compressed = await compressImage(file)
      const base64 = await fileToBase64(compressed)
      setAvatar(base64)
    } catch (error) {
      alert('Failed to process image')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name || !nickname) {
      alert('Name and nickname are required')
      return
    }

    setLoading(true)
    try {
      await onSave({ name, nickname, avatar: avatar || undefined })
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save player')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {player ? 'Edit Player' : 'Add Player'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label htmlFor="nickname" className="block text-sm font-medium mb-2">
              Nickname *
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label htmlFor="avatar" className="block text-sm font-medium mb-2">
              Avatar (optional)
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="input"
            />
            {avatar && (
              <div className="mt-2">
                <img
                  src={`data:image/jpeg;base64,${avatar}`}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setAvatar(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="text-sm text-red-500 mt-2"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
