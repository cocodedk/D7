import { usePlayers } from '../hooks/usePlayers'

interface TournamentResults {
  [playerId: string]: {
    plusRemainder: number
    minusRemainder: number
    plusClusters: number
    minusClusters: number
    netScore: number
    player?: {
      id: string
      name: string
      nickname: string
      avatar: string | null
    } | null
  }
}

interface ResultsTableProps {
  results: TournamentResults
  tournamentId: string
}

export default function ResultsTable({ results, tournamentId: _tournamentId }: ResultsTableProps) {
  const { players } = usePlayers()

  const sortedResults = Object.entries(results)
    .map(([playerId, score]) => {
      // Use player info from results if available, otherwise fall back to usePlayers hook
      const player = score.player || players.find((p) => p.id === playerId)
      return {
        player: player || { id: playerId, nickname: 'Unknown', name: 'Unknown', avatar: null, created_at: '' },
        score,
      }
    })
    .sort((a, b) => b.score.netScore - a.score.netScore)

  return (
    <div className="card overflow-x-auto">
      <h2 className="text-lg font-semibold mb-4">Tournament Results</h2>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-4">Player</th>
            <th className="text-right py-2 px-4">+ Clusters</th>
            <th className="text-right py-2 px-4">- Clusters</th>
            <th className="text-right py-2 px-4">+ Remainder</th>
            <th className="text-right py-2 px-4">- Remainder</th>
            <th className="text-right py-2 px-4 font-bold">Net Score</th>
          </tr>
        </thead>
        <tbody>
          {sortedResults.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-600 dark:text-gray-400">
                No results yet
              </td>
            </tr>
          ) : (
            sortedResults.map(({ player, score }) => (
              <tr
                key={player.id}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {player.avatar && (
                      <img
                        src={`data:image/jpeg;base64,${player.avatar}`}
                        alt={player.nickname}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">{player.nickname}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {player.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-right py-3 px-4 text-green-600 dark:text-green-400">
                  {score.plusClusters}
                </td>
                <td className="text-right py-3 px-4 text-red-600 dark:text-red-400">
                  {score.minusClusters}
                </td>
                <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                  {score.plusRemainder}
                </td>
                <td className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">
                  {score.minusRemainder}
                </td>
                <td className="text-right py-3 px-4 font-bold">
                  {score.netScore > 0 ? (
                    <span className="text-green-600 dark:text-green-400">
                      +{score.netScore}
                    </span>
                  ) : score.netScore < 0 ? (
                    <span className="text-red-600 dark:text-red-400">{score.netScore}</span>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400">0</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
