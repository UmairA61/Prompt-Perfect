import React from 'react';
import { Screen, Button, Card, Pill, Avatar, PlayerStatusList } from './UI.jsx';

export function HostLobbyScreen({ lobby, onStartGame, onCloseLobby }) {
  if (!lobby) return null;
  const players = Object.values(lobby.players || {});
  return (
    <Screen name="Host Lobby" className="lobby-screen">
      <header className="lobby-header">
        <div className="code-wrap">
          <h2>Lobby Code</h2>
          <div className="big-code">{lobby.code}</div>
        </div>
        <div className="lobby-header-actions">
          <Button color="sky" onClick={() => navigator.clipboard.writeText(lobby.code)}>Copy Code</Button>
          <Button color="orange" onClick={onCloseLobby}>Close Lobby</Button>
        </div>
      </header>
      <div className="lobby-content">
        <Card className="player-panel">
          <div className="panel-title-row">
            <h3>Players</h3>
            <Pill color="lime">{players.length} / {lobby.settings?.max_players || 8} joined</Pill>
          </div>
          <PlayerStatusList players={players} />
        </Card>
        <Card color="lemon" className="host-controls">
          <h3>Host Controls</h3>
          <div className="setting-line"><span>Rounds</span><strong>{lobby.total_rounds}</strong></div>
          <div className="setting-line"><span>Max players</span><strong>{lobby.settings?.max_players}</strong></div>
          <div className="setting-line"><span>Category</span><strong>{lobby.settings?.category}</strong></div>
          <Button color="pink" wide onClick={onStartGame} disabled={players.length < 1}>Start Game</Button>
        </Card>
      </div>
    </Screen>
  );
}

export function PlayerLobbyScreen({ lobby, onToggleReady, onLeaveLobby }) {
  if (!lobby) return null;
  const players = Object.values(lobby.players || {});
  return (
    <Screen name="Player Lobby" className="lobby-screen">
      <header className="lobby-header player">
        <div className="code-wrap">
          <h2>Lobby Code</h2>
          <div className="big-code">{lobby.code}</div>
        </div>
        <Card color="sky" className="waiting-card">Waiting for host to start...</Card>
      </header>
      <div className="lobby-content">
        <Card className="player-panel player-only">
          <div className="panel-title-row">
            <h3>Players</h3>
            <Pill color="lime">{players.length} / {lobby.settings?.max_players || 8} joined</Pill>
          </div>
          <PlayerStatusList players={players} />
        </Card>
        <Card color="orange" className="ready-toggle-card">
          <h3>Ready up?</h3>
          <p>No host controls here. Just vibes, names, and mild dread.</p>
          <Button color="lime" wide onClick={onToggleReady}>Toggle Ready</Button>
          <Button color="pink" wide onClick={onLeaveLobby}>Leave Lobby</Button>
        </Card>
      </div>
    </Screen>
  );
}
