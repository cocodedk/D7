import '../../styles/public.css'

interface Player {
  id: string
  name: string
  nickname: string
  avatar: string | null
}

interface Score {
  plusRemainder: number
  minusRemainder: number
  plusClusters: number
  minusClusters: number
  netScore: number
}

interface PlayerLeaderboardCardProps {
  player: Player | null
  score: Score
  rank: number
}

export default function PlayerLeaderboardCard({ player, score, rank }: PlayerLeaderboardCardProps) {
  const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : ''

  return (
    <div className={`leaderboard-card ${rankClass}`}>
      <div className="player-info">
        {player?.avatar && (
          <img
            src={`data:image/jpeg;base64,${player.avatar}`}
            alt={player.nickname}
            className="player-avatar"
          />
        )}
        <div className="player-details">
          <h3>{player?.nickname || 'Unknown Player'}</h3>
          <p>{player?.name || ''}</p>
        </div>
        {rank <= 3 && (
          <div style={{ marginLeft: 'auto', fontSize: '2rem' }}>
            {rank === 1 && '🥇'}
            {rank === 2 && '🥈'}
            {rank === 3 && '🥉'}
          </div>
        )}
      </div>
      <div className="score-stats">
        <div className="score-stat">
          <div className="score-stat-label">+ Clusters</div>
          <div className="score-stat-value positive">{score.plusClusters}</div>
        </div>
        <div className="score-stat">
          <div className="score-stat-label">- Clusters</div>
          <div className="score-stat-value negative">{score.minusClusters}</div>
        </div>
        <div className="score-stat">
          <div className="score-stat-label">+ Remainder</div>
          <div className="score-stat-value positive">{score.plusRemainder}</div>
        </div>
        <div className="score-stat">
          <div className="score-stat-label">- Remainder</div>
          <div className="score-stat-value negative">{score.minusRemainder}</div>
        </div>
        <div className="score-stat">
          <div className="score-stat-label">Net Score</div>
          <div
            className={`score-stat-value ${score.netScore > 0 ? 'positive' : score.netScore < 0 ? 'negative' : ''}`}
          >
            {score.netScore > 0 ? '+' : ''}
            {score.netScore}
          </div>
        </div>
      </div>
      <div className={`net-score ${score.netScore > 0 ? 'positive' : score.netScore < 0 ? 'negative' : ''}`}>
        {score.netScore > 0 ? '+' : ''}
        {score.netScore}
      </div>
    </div>
  )
}
