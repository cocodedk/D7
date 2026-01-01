import { Player } from '../hooks/usePlayers'

interface PlayerCardProps {
  player: Player
  onEdit: () => void
  onDelete: () => void
}

export default function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        {player.avatar ? (
          <img
            src={`data:image/jpeg;base64,${player.avatar}`}
            alt={player.nickname}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl">
            👤
          </div>
        )}
        <div className="flex-1">
          <div className="font-semibold">{player.nickname}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{player.name}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="flex-1 btn btn-secondary text-sm">
          Edit
        </button>
        <button onClick={onDelete} className="flex-1 btn btn-danger text-sm">
          Delete
        </button>
      </div>
    </div>
  )
}
