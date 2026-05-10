import React, { useState, useEffect, useRef } from 'react';
import { Screen, Button, Card, Avatar, Pill } from './UI.jsx';

/**
 * Gartic Phone–style chat results reveal.
 * Left side = "Original" sender showing the target image.
 * Right side = each player's result appears one by one as chat bubbles.
 */
export function ChatResultsScreen({ results, isHost, onNextRound }) {
  const [revealIndex, setRevealIndex] = useState(-1);
  const [showWinner, setShowWinner] = useState(false);
  const chatRef = useRef(null);

  const players = results?.players || [];
  // Sort by score ascending so winner is revealed last for drama
  const revealOrder = [...players].sort((a, b) => a.score - b.score);

  useEffect(() => {
    if (!results) return;
    setRevealIndex(-1);
    setShowWinner(false);

    // Stagger reveals: first bubble at 1s, then every 2.5s
    const timers = [];
    revealOrder.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setRevealIndex(i);
      }, 1000 + i * 2800));
    });
    // Show winner after all revealed
    timers.push(setTimeout(() => {
      setShowWinner(true);
    }, 1000 + revealOrder.length * 2800 + 800));
    return () => timers.forEach(clearTimeout);
  }, [results]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [revealIndex, showWinner]);

  if (!results) return null;

  const winner = players[0]; // Already sorted highest first from server

  return (
    <Screen name="Round Results" className="chat-results-screen">
      <div className="chat-results-header">
        <h2>Round {results.round} Results</h2>
        {showWinner && (
          <Pill color="lime" className="winner-pill-anim">
            🏆 {winner?.player_name} wins with {winner?.score}%!
          </Pill>
        )}
      </div>

      <div className="chat-results-layout">
        {/* Chat Window */}
        <div className="chat-window" ref={chatRef}>
          {/* Original image - left side sender */}
          <div className="chat-message chat-left chat-appear">
            <div className="chat-avatar-wrap">
              <span className="avatar avatar-lemon avatar-md chat-bot-avatar">🎯</span>
              <span className="chat-sender-name">Original</span>
            </div>
            <div className="chat-bubble chat-bubble-left">
              <img src={results.targetImageUrl} alt="Original target" className="chat-image" />
              <p className="chat-caption">Can you recreate this image?</p>
            </div>
          </div>

          {/* Player results - right side, revealed one by one */}
          {revealOrder.map((player, i) => {
            if (i > revealIndex) return null;
            const isWinner = player.player_id === winner?.player_id;
            return (
              <div key={player.player_id} className={`chat-message chat-right chat-appear ${isWinner && showWinner ? 'chat-winner' : ''}`}>
                <div className="chat-bubble chat-bubble-right">
                  {/* Prompt message */}
                  <div className="chat-prompt-msg">
                    <span className="chat-prompt-label">Prompt:</span>
                    <p>"{player.prompt}"</p>
                  </div>
                  {/* Generated image */}
                  {player.image_url ? (
                    <img src={player.image_url} alt={`${player.player_name}'s generation`} className="chat-image" />
                  ) : (
                    <div className="chat-image-placeholder">No image</div>
                  )}
                  {/* Score */}
                  <div className={`chat-score ${player.score >= 80 ? 'score-high' : player.score >= 60 ? 'score-mid' : 'score-low'}`}>
                    {player.score}% similarity
                  </div>
                </div>
                <div className="chat-avatar-wrap chat-avatar-right">
                  <span className={`avatar avatar-${player.player_color} avatar-md`}>
                    {player.player_initials}
                  </span>
                  <span className="chat-sender-name">{player.player_name}</span>
                </div>
              </div>
            );
          })}

          {/* Winner announcement */}
          {showWinner && winner && (
            <div className="chat-message chat-center chat-appear">
              <div className="chat-winner-announce">
                <span className="sparkle s1">✨</span>
                <span className={`avatar avatar-${winner.player_color} avatar-lg`}>{winner.player_initials}</span>
                <h3>{winner.player_name} wins the round!</h3>
                <Pill color="lime">{winner.score}% match</Pill>
                <span className="sparkle s2">✨</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Original prompt reveal + controls */}
        <aside className="chat-sidebar">
          <Card color="lemon" className="original-prompt-card">
            <h3>Original Prompt</h3>
            <p className="original-prompt-text">{results.targetPrompt}</p>
          </Card>

          <Card className="round-scores-card">
            <h3>Round Scores</h3>
            {players.map((p, i) => (
              <div key={p.player_id} className={`score-row ${i === 0 ? 'score-row-winner' : ''}`}>
                <span className="score-rank">{i + 1}</span>
                <span className={`avatar avatar-${p.player_color} avatar-sm`}>{p.player_initials}</span>
                <strong>{p.player_name}</strong>
                <em>{p.score}%</em>
              </div>
            ))}
          </Card>

          {isHost && showWinner && (
            <Button color="pink" wide onClick={onNextRound}>
              Next Round →
            </Button>
          )}
          {!isHost && showWinner && (
            <Card color="sky" className="waiting-next-card">
              <p style={{ margin: 0, textAlign: 'center', fontWeight: 800 }}>Waiting for host...</p>
            </Card>
          )}
        </aside>
      </div>
    </Screen>
  );
}
