import React from 'react';
import { createRoot } from 'react-dom/client';
import { useGameState } from './hooks.js';
import { HomeScreen } from './components/HomeScreen.jsx';
import { CreateLobbyScreen, JoinLobbyScreen } from './components/LobbyScreens.jsx';
import { HostLobbyScreen, PlayerLobbyScreen } from './components/WaitingScreens.jsx';
import { PromptScreen, GeneratingScreen } from './components/GameScreens.jsx';
import { ChatResultsScreen } from './components/ChatResults.jsx';
import { LeaderboardScreen } from './components/LeaderboardScreen.jsx';
import './styles.css';
import './chat-results.css';

function App() {
  const [state, actions] = useGameState();

  const renderScreen = () => {
    switch (state.screen) {
      case 'home':
        return <HomeScreen goTo={actions.goTo} />;

      case 'createLobby':
        return <CreateLobbyScreen onCreateLobby={actions.createLobby} goTo={actions.goTo} />;

      case 'joinLobby':
        return <JoinLobbyScreen onJoinLobby={actions.joinLobby} goTo={actions.goTo} />;

      case 'hostLobby':
        return (
          <HostLobbyScreen
            lobby={state.lobby}
            onStartGame={() => actions.sendWs({ type: 'start_game' })}
            onCloseLobby={actions.closeLobby}
          />
        );

      case 'playerLobby':
        return (
          <PlayerLobbyScreen
            lobby={state.lobby}
            onToggleReady={() => actions.sendWs({ type: 'ready_toggle' })}
            onLeaveLobby={actions.leaveLobby}
          />
        );

      case 'prompt':
        return (
          <PromptScreen
            roundData={state.roundData}
            onSubmitPrompt={actions.submitPrompt}
            isHost={state.isHost}
            onForceGenerate={() => actions.sendWs({ type: 'force_generate' })}
          />
        );

      case 'generating':
        return <GeneratingScreen roundData={state.roundData} />;

      case 'results':
        return (
          <ChatResultsScreen
            results={state.results}
            isHost={state.isHost}
            onNextRound={() => actions.sendWs({ type: 'next_round' })}
          />
        );

      case 'leaderboard':
        return (
          <LeaderboardScreen
            leaderboard={state.leaderboard}
            isHost={state.isHost}
            onPlayAgain={() => actions.sendWs({ type: 'play_again' })}
            goTo={actions.goTo}
          />
        );

      default:
        return <HomeScreen goTo={actions.goTo} />;
    }
  };

  return (
    <main className="app-stage">
      {state.error && (
        <div className="error-toast" onClick={actions.clearError}>
          ⚠️ {state.error} <span>(click to dismiss)</span>
        </div>
      )}
      {renderScreen()}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
