import React from 'react';
import { Screen, Button, Card } from './UI.jsx';

export function LeaderboardScreen({ leaderboard, isHost, onPlayAgain, goTo }) {
  if (!leaderboard) return null;
  const ranked = leaderboard.players || [];
  const history = leaderboard.roundHistory || [];
  const winner = ranked[0];
  const winnerName = winner?.player_name || 'Winner';
  const winnerInitials = winner?.player_initials || '?';
  const winnerColor = winner?.player_color || 'lemon';

  return (
    <Screen name="Final Leaderboard" className="leaderboard-screen">
      <div className="leaderboard-layout">
        <section className="celebration">
          <h2 className="winner-title" aria-label={`${winnerName} is Prompt Perfect`}>
            <span className="winner-name-line">
              <span className="winner-name">{winnerName}</span>
              <span className="winner-is">is</span>
            </span>
            <span className="winner-prompt">Prompt</span>
            <span className="winner-perfect">Perfect!</span>
          </h2>
          <div className="trophy-card">
            <span className={`avatar avatar-${winnerColor} avatar-lg`}>{winnerInitials}</span>
            <strong>1st Place</strong>
            <span>{winner?.points} total points</span>
          </div>
          <div className="button-row centered">
            {isHost ? (
              <>
                <Button color="lemon" onClick={onPlayAgain}>Play Again</Button>
                <Button color="sky" onClick={() => goTo('home')}>New Lobby</Button>
              </>
            ) : (
              <Button color="sky" onClick={() => goTo('home')}>Back to Home</Button>
            )}
          </div>
        </section>
        <div className="leaderboard-sidebar">
          <div className="leaderboard-fanfare" aria-hidden="true">
            <span className="fanfare-slab fanfare-slab-a" />
            <span className="fanfare-slab fanfare-slab-b" />
            <span className="fanfare-slab fanfare-slab-c" />
            <span className="fanfare-spark fanfare-spark-a" />
            <span className="fanfare-spark fanfare-spark-b" />
          </div>
          <Card className="leaderboard-list">
            <div className="leaderboard-card-title">
              <h3>Final Leaderboard</h3>
              <span>Top Scores</span>
            </div>
            {ranked.map((p, i) => (
              <div key={p.player_id} className={`leader-row place-${i + 1}`}>
                <span className="rank">{i + 1}</span>
                <span className={`avatar avatar-${p.player_color} avatar-md`}>{p.player_initials}</span>
                <strong>{p.player_name}</strong>
                <em>{p.points} pts</em>
              </div>
            ))}
          </Card>
          <Card color="pink" className="round-history">
            <h3>Round History</h3>
            {history.map((h) => (
              <div key={h.round} className="history-row"><strong>R{h.round}</strong><span>{h.winner_name} won with {h.winner_score}%</span></div>
            ))}
          </Card>
        </div>
      </div>
    </Screen>
  );
}
