import { useState, FormEvent, useRef } from 'react'
import { Tournament } from '../hooks/useTournaments'
import { Player } from '../hooks/usePlayers'
import type { ScoreEvent } from '../lib/scoring'
import { fileToBase64, compressImage } from '../lib/api'

interface ConfirmationScreenProps {
  tournament: Tournament
  events: ScoreEvent[]
  players: Player[]
  onConfirm: (comment?: string, photo?: string) => Promise<void>
  onCancel: () => void
}

export default function ConfirmationScreen({
  tournament,
  events,
  players,
  onConfirm,
  onCancel,
}: ConfirmationScreenProps) {
  const [comment, setComment] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const compressed = await compressImage(file)
      const base64 = await fileToBase64(compressed)
      setPhoto(base64)
    } catch (error) {
      alert('Failed to process image')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (events.length === 0) {
      alert('No events to save')
      return
    }

    setLoading(true)
    try {
      await onConfirm(comment || undefined, photo || undefined)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save game')
    } finally {
      setLoading(false)
    }
  }

  // Calculate summary per player
  const playerSummary = players.map((player) => {
    const playerEvents = events.filter((e) => e.playerId === player.id)
    const iCount = playerEvents.filter((e) => e.type === 'I').length
    const xCount = playerEvents.filter((e) => e.type === 'X').length
    return { player, iCount, xCount }
  }).filter((s) => s.iCount > 0 || s.xCount > 0)

  return (
    <div className="p-4 space-y-4 max-h-screen overflow-y-auto">
      <h1 className="text-2xl font-bold">Confirm Game</h1>

      <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <p className="text-yellow-800 dark:text-yellow-200 font-semibold">
          ⚠️ Warning: This action is irreversible
        </p>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">Tournament</h2>
        <p>
          {new Date(tournament.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">Timestamp</h2>
        <p>{new Date().toLocaleString()}</p>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Score Summary</h2>
        <div className="space-y-2">
          {playerSummary.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No events recorded</p>
          ) : (
            playerSummary.map(({ player, iCount, xCount }) => (
              <div
                key={player.id}
                className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-2">
                  {player.avatar && (
                    <img
                      src={`data:image/jpeg;base64,${player.avatar}`}
                      alt={player.nickname}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <span className="font-medium">{player.nickname}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600 dark:text-green-400">I: {iCount}</span>
                  <span className="text-red-600 dark:text-red-400">X: {xCount}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="comment" className="block text-sm font-medium mb-2">
            Comment (optional, max 500 chars)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            className="input min-h-[100px]"
            placeholder="Add a comment about this game..."
            maxLength={500}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {comment.length}/500
          </p>
        </div>

        <div>
          <label htmlFor="photo" className="block text-sm font-medium mb-2">
            Photo (optional)
          </label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="input"
          />
          {photo && (
            <div className="mt-2">
              <img
                src={`data:image/jpeg;base64,${photo}`}
                alt="Preview"
                className="max-w-full h-48 object-contain rounded"
              />
              <button
                type="button"
                onClick={() => {
                  setPhoto(null)
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
            disabled={loading || events.length === 0}
          >
            {loading ? 'Saving...' : 'Confirm & Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
