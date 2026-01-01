import { useEffect, useState } from 'react'
import { useGames } from '../hooks/useGames'

interface UndoNotificationProps {
  gameId: string
  onUndo: () => void
}

export default function UndoNotification({ gameId, onUndo }: UndoNotificationProps) {
  const [timeLeft, setTimeLeft] = useState(60)
  const { deleteGame } = useGames()

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleUndo = async () => {
    try {
      await deleteGame(gameId)
      onUndo()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to undo game')
    }
  }

  if (timeLeft === 0) {
    return null
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50">
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-blue-800 dark:text-blue-200">
              Game saved
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              You can undo within {timeLeft} seconds
            </p>
          </div>
          <button
            onClick={handleUndo}
            className="btn btn-secondary text-sm"
          >
            Undo
          </button>
        </div>
      </div>
    </div>
  )
}
