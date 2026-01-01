import { useState } from 'react'
import { Tournament } from '../hooks/useTournaments'

interface TournamentCardProps {
  tournament: Tournament
  isActive: boolean
  onStart: () => void
  onClose: (confirmation: string) => void
}

export default function TournamentCard({
  tournament,
  isActive,
  onStart,
  onClose,
}: TournamentCardProps) {
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [confirmation, setConfirmation] = useState('')

  const handleClose = () => {
    if (confirmation === tournament.date) {
      onClose(confirmation)
      setShowCloseModal(false)
      setConfirmation('')
    } else {
      alert('Tournament date does not match')
    }
  }

  return (
    <>
      <div className={`card ${isActive ? 'border-green-500 dark:border-green-400' : ''}`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">
              {new Date(tournament.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
            <div className="flex gap-2 mt-1">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  tournament.state === 'active'
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : tournament.state === 'draft'
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {tournament.state}
              </span>
            </div>
          </div>
        </div>

        {tournament.started_at && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Started: {new Date(tournament.started_at).toLocaleDateString()}
          </p>
        )}

        {tournament.closed_at && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Closed: {new Date(tournament.closed_at).toLocaleDateString()}
          </p>
        )}

        <div className="flex gap-2 mt-4">
          {tournament.state === 'draft' && (
            <button onClick={onStart} className="btn btn-primary flex-1">
              Start Tournament
            </button>
          )}
          {tournament.state === 'active' && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="btn btn-danger flex-1"
            >
              Close Tournament
            </button>
          )}
        </div>
      </div>

      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Close Tournament</h2>
            <p className="text-red-600 dark:text-red-400 mb-4">
              This action is irreversible. Enter the tournament date to confirm.
            </p>
            <input
              type="date"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="input mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCloseModal(false)
                  setConfirmation('')
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleClose}
                disabled={confirmation !== tournament.date}
                className="flex-1 btn btn-danger"
              >
                Close Tournament
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
