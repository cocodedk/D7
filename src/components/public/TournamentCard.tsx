import { Link } from 'react-router-dom'
import '../../styles/public.css'

interface TournamentCardProps {
  id: string
  date: string
}

export default function TournamentCard({ id, date }: TournamentCardProps) {
  const dateObj = new Date(date)
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const year = dateObj.getFullYear()

  return (
    <Link to={`/public/results/${id}`} className="tournament-card">
      <div className="tournament-date">{formattedDate}</div>
      <div className="tournament-year">{year}</div>
    </Link>
  )
}
