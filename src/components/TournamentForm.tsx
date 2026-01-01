import { useState, FormEvent } from 'react'

interface TournamentFormProps {
  onSave: (date: string) => Promise<void>
  onCancel: () => void
}

export default function TournamentForm({ onSave, onCancel }: TournamentFormProps) {
  const [date, setDate] = useState(() => {
    // Default to today's date in YYYY-MM-DD format
    return new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!date) {
      alert('Tournament date is required')
      return
    }

    setLoading(true)
    try {
      await onSave(date)
      setDate(new Date().toISOString().split('T')[0])
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create tournament')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">New Tournament</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tournament-date" className="block text-sm font-medium mb-2">
              Tournament Date *
            </label>
            <input
              id="tournament-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
              required
              autoFocus
            />
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
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
