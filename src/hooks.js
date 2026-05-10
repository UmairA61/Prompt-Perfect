import { useState, useEffect, useRef, useCallback } from 'react';

const API = '/api';

export function useGameState() {
  const [state, setState] = useState({
    screen: 'home',
    playerId: null,
    lobbyCode: null,
    isHost: false,
    lobby: null,
    roundData: null,
    results: null,
    leaderboard: null,
    error: null,
  });

  const wsRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const update = (patch) => setState((s) => ({ ...s, ...patch }));

  const refreshLobby = useCallback((code) => {
    fetch(`${API}/lobby/${code}`).then(r => r.json()).then(d => {
      if (d.lobby) update({ lobby: d.lobby });
    }).catch(() => {});
  }, []);

  const connectWs = useCallback((code, pid) => {
    if (wsRef.current) wsRef.current.close();
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws/${code}/${pid}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      switch (msg.type) {
        case 'state_sync':
          update({ lobby: msg.lobby });
          break;
        case 'player_joined':
        case 'player_ready':
        case 'player_disconnected':
        case 'player_left':
          refreshLobby(code);
          break;
        case 'host_transferred':
          // Check if we became the new host
          update({ isHost: msg.new_host_id === stateRef.current.playerId });
          refreshLobby(code);
          break;
        case 'round_started':
          update({
            screen: 'prompt',
            roundData: {
              round: msg.round,
              totalRounds: msg.total_rounds,
              targetImageUrl: msg.target_image_url,
              timeLimit: msg.time_limit,
              startedAt: Date.now(),
            },
            results: null,
          });
          break;
        case 'prompt_submitted':
          refreshLobby(code);
          break;
        case 'generating_started':
          update({ screen: 'generating' });
          break;
        case 'player_generated':
          break;
        case 'results_ready':
          update({
            screen: 'results',
            results: {
              round: msg.round,
              targetImageUrl: msg.target_image_url,
              targetPrompt: msg.target_prompt,
              players: msg.results,
              roundHistory: msg.round_history,
            },
          });
          break;
        case 'game_over':
          update({
            screen: 'leaderboard',
            leaderboard: {
              players: msg.leaderboard,
              roundHistory: msg.round_history,
            },
          });
          break;
        case 'game_reset':
          update({
            screen: stateRef.current.isHost ? 'hostLobby' : 'playerLobby',
            lobby: msg.lobby,
            results: null,
            leaderboard: null,
          });
          break;
        case 'lobby_closed':
          update({ screen: 'home', lobby: null, lobbyCode: null, playerId: null, isHost: false, error: 'Lobby was closed by the host.' });
          if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
          break;
      }
    };

    ws.onclose = () => { wsRef.current = null; };
  }, [refreshLobby]);

  const actions = {
    createLobby: async (name, rounds, maxPlayers, category) => {
      try {
        const res = await fetch(`${API}/lobby/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host_name: name, rounds, max_players: maxPlayers, category }),
        });
        const data = await res.json();
        update({ playerId: data.host_id, lobbyCode: data.code, isHost: true, lobby: data.lobby, screen: 'hostLobby' });
        connectWs(data.code, data.host_id);
      } catch (err) {
        update({ error: err.message });
      }
    },

    joinLobby: async (code, name) => {
      try {
        const res = await fetch(`${API}/lobby/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, player_name: name }),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
        const data = await res.json();
        update({ playerId: data.player_id, lobbyCode: code.toUpperCase(), isHost: false, lobby: data.lobby, screen: 'playerLobby' });
        connectWs(code.toUpperCase(), data.player_id);
      } catch (err) {
        update({ error: err.message });
      }
    },

    sendWs: (msg) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(msg));
      }
    },

    submitPrompt: async (prompt) => {
      try {
        await fetch(`${API}/round/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lobby_code: stateRef.current.lobbyCode, player_id: stateRef.current.playerId, prompt }),
        });
      } catch (err) {
        update({ error: err.message });
      }
    },

    closeLobby: () => {
      actions.sendWs({ type: 'close_lobby' });
      update({ screen: 'home', lobby: null, lobbyCode: null, playerId: null, isHost: false });
    },

    leaveLobby: () => {
      actions.sendWs({ type: 'leave_lobby' });
      update({ screen: 'home', lobby: null, lobbyCode: null, playerId: null, isHost: false });
    },

    goTo: (screen) => update({ screen }),
    clearError: () => update({ error: null }),
  };

  return [state, actions];
}
