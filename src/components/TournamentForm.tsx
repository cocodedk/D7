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
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TournamentForm.tsx:15',message:'handleSubmit entry',data:{date},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    e.preventDefault()
    if (!date) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TournamentForm.tsx:18',message:'handleSubmit no date',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      alert('Tournament date is required')
      return
    }

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TournamentForm.tsx:22',message:'Before setLoading true',data:{date},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    setLoading(true)
    try {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TournamentForm.tsx:25',message:'Before onSave call',data:{date},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      await onSave(date)
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TournamentForm.tsx:27',message:'After onSave success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setDate(new Date().toISOString().split('T')[0])
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TournamentForm.tsx:30',message:'handleSubmit error',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      alert(error instanceof Error ? error.message : 'Failed to create tournament')
    } finally {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TournamentForm.tsx:33',message:'handleSubmit finally',data:{loading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
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
              onClick={() => {
                // #region agent log
                fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TournamentForm.tsx:84',message:'Create button clicked',data:{loading,date},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
                // #endregion
              }}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
