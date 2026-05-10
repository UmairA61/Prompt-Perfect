import React from 'react';
import { Screen, Button, Card, Avatar, Pill } from './UI.jsx';

export function LeaderboardScreen({ leaderboard, isHost, onPlayAgain, goTo }) {
  if (!leaderboard) return null;
  const ranked = leaderboard.players || [];
  const history = leaderboard.roundHistory || [];
  const winner = ranked[0];

  return (
    <Screen name="Final Leaderboard" className="leaderboard-screen">
      <div className="leaderboard-layout">
        <section className="celebration">
          <h2 className="winner-title" aria-label={`${winner?.player_name} is Prompt Perfect`}>
            <span className="winner-name-line">{winner?.player_name} is</span>
            <span className="winner-prompt">Prompt</span>
            <span className="winner-perfect">Perfect!</span>
          </h2>
          <p>{history.length} rounds, countless questionable prompts, one champion.</p>
          <div className="trophy-card">
            <span className={`avatar avatar-${winner?.player_color} avatar-lg`}>{winner?.player_initials}</span>
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
          <Card className="leaderboard-list">
            <h3>Final Leaderboard</h3>
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
              <div key={h.round}><strong>R{h.round}</strong><span>{h.winner_name} won with {h.winner_score}%</span></div>
            ))}
          </Card>
        </div>
      </div>
    </Screen>
  );
}
