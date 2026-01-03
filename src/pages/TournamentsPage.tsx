import { useState } from 'react'
import { useTournaments } from '../hooks/useTournaments'
import TournamentCard from '../components/TournamentCard'
import TournamentForm from '../components/TournamentForm'

export default function TournamentsPage() {
  const {
    tournaments,
    activeTournament,
    loading,
    error,
    createTournament,
    startTournament,
    closeTournament,
  } = useTournaments()
  const [showForm, setShowForm] = useState(false)

  if (loading) {
    return <div className="p-4 text-center">Loading tournaments...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tournaments</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          disabled={!!activeTournament}
        >
          New Tournament
        </button>
      </div>

      {(() => {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TournamentsPage.tsx:39',message:'Render activeTournament check',data:{hasActiveTournament:!!activeTournament,activeTournamentId:activeTournament?.id,activeTournamentDate:activeTournament?.date},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        return activeTournament && (
          <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <p className="font-semibold text-green-800 dark:text-green-200">
              Active: {new Date(activeTournament.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )
      })()}

      {(() => {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TournamentsPage.tsx:51',message:'Render tournaments list',data:{tournamentsLength:tournaments.length,tournamentIds:tournaments.map(t=>t.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return tournaments.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No tournaments yet. Create your first tournament.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                isActive={activeTournament?.id === tournament.id}
                onStart={() => startTournament(tournament.id)}
                onClose={(confirmation) => closeTournament(tournament.id, confirmation)}
              />
            ))}
          </div>
        )
      })()}

      {(() => {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TournamentsPage.tsx:81',message:'Render showForm check',data:{showForm},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        return showForm && (
          <TournamentForm
            onSave={async (date) => {
            // #region agent log
            fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TournamentsPage.tsx:73',message:'onSave entry',data:{date,showForm},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            try {
              await createTournament(date)
              // #region agent log
              fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TournamentsPage.tsx:76',message:'createTournament completed',data:{tournamentsCount:tournaments.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
              // #region agent log
              fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TournamentsPage.tsx:78',message:'Before setShowForm false',data:{showForm},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
              // #endregion
              setShowForm(false)
              // #region agent log
              fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TournamentsPage.tsx:80',message:'After setShowForm false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
              // #endregion
            } catch (err) {
              // #region agent log
              fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TournamentsPage.tsx:83',message:'onSave error',data:{error:err instanceof Error?err.message:String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              throw err
            }
          }}
          onCancel={() => setShowForm(false)}
        />
        )
      })()}
    </div>
  )
}
