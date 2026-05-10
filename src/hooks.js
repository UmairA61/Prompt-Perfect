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

  const pollRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const update = (patch) => setState((s) => ({ ...s, ...patch }));

  // Process events from polling (same logic as old WebSocket handler)
  const processEvents = useCallback((events, lobbyData) => {
    for (const msg of events) {
      switch (msg.type) {
        case 'player_joined':
        case 'player_ready':
        case 'player_disconnected':
        case 'player_left':
          // Lobby state is included in poll response
          if (lobbyData) update({ lobby: lobbyData });
          break;
        case 'host_transferred':
          update({ isHost: msg.new_host_id === stateRef.current.playerId });
          if (lobbyData) update({ lobby: lobbyData });
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
          if (lobbyData) update({ lobby: lobbyData });
          break;
        case 'generating_started':
          update({ screen: 'generating' });
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
          stopPolling();
          update({
            screen: 'home',
            lobby: null,
            lobbyCode: null,
            playerId: null,
            isHost: false,
            error: msg.reason || 'Lobby was closed.',
          });
          break;
      }
    }
  }, []);

  const startPolling = useCallback((code, pid) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/poll/${code}/${pid}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          processEvents(data.events, data.lobby);
        } else if (data.lobby) {
          // Always sync lobby state
          update({ lobby: data.lobby });
        }
      } catch (err) {
        // Silently ignore poll errors
      }
    }, 2000);
  }, [processEvents]);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  // Clean up polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

  const actions = {
    createLobby: async (name, rounds, maxPlayers, category) => {
      try {
        const res = await fetch(`${API}/lobby/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host_name: name, rounds, max_players: maxPlayers, category }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({ detail: 'Server error' }));
          throw new Error(e.detail || 'Failed to create lobby');
        }
        const data = await res.json();
        update({ playerId: data.host_id, lobbyCode: data.code, isHost: true, lobby: data.lobby, screen: 'hostLobby' });
        startPolling(data.code, data.host_id);
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
        if (!res.ok) {
          const e = await res.json().catch(() => ({ detail: 'Server error' }));
          throw new Error(e.detail || 'Failed to join lobby');
        }
        const data = await res.json();
        update({ playerId: data.player_id, lobbyCode: code.toUpperCase(), isHost: false, lobby: data.lobby, screen: 'playerLobby' });
        startPolling(code.toUpperCase(), data.player_id);
      } catch (err) {
        update({ error: err.message });
      }
    },

    sendAction: async (actionType) => {
      const { lobbyCode, playerId } = stateRef.current;
      if (!lobbyCode || !playerId) return;
      try {
        await fetch(`${API}/game/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lobby_code: lobbyCode, player_id: playerId, action: actionType }),
        });
      } catch (err) {
        update({ error: err.message });
      }
    },

    // Keep sendWs as alias for sendAction (for component compatibility)
    sendWs: (msg) => {
      actions.sendAction(msg.type);
    },

    submitPrompt: async (prompt) => {
      try {
        const res = await fetch(`${API}/round/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lobby_code: stateRef.current.lobbyCode, player_id: stateRef.current.playerId, prompt }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({ detail: 'Submit failed' }));
          throw new Error(e.detail || 'Submit failed');
        }
      } catch (err) {
        update({ error: err.message });
      }
    },

    closeLobby: () => {
      actions.sendAction('close_lobby');
      stopPolling();
      update({ screen: 'home', lobby: null, lobbyCode: null, playerId: null, isHost: false });
    },

    leaveLobby: () => {
      actions.sendAction('leave_lobby');
      stopPolling();
      update({ screen: 'home', lobby: null, lobbyCode: null, playerId: null, isHost: false });
    },

    goTo: (screen) => update({ screen }),
    clearError: () => update({ error: null }),
  };

  return [state, actions];
}
