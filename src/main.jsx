import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const players = [
  {
    name: 'Maya',
    initials: 'MA',
    color: 'pink',
    status: 'Ready',
    prompt: 'A glowing sci-fi city floating above the clouds at sunset',
    score: 91,
    points: 8,
  },
  {
    name: 'Jax',
    initials: 'JX',
    color: 'sky',
    status: 'Ready',
    prompt: 'Cyberpunk towers in the sky during golden hour',
    score: 86,
    points: 6,
  },
  {
    name: 'Priya',
    initials: 'PR',
    color: 'lime',
    status: 'Waiting',
    prompt: 'A fantasy castle above mountains with orange light',
    score: 67,
    points: 5,
  },
  {
    name: 'Leo',
    initials: 'LE',
    color: 'lemon',
    status: 'Ready',
    prompt: 'A giant floating neighborhood with tiny rockets and warm clouds',
    score: 74,
    points: 4,
  },
  {
    name: 'Nova',
    initials: 'NO',
    color: 'violet',
    status: 'Generating',
    prompt: 'A dreamy future skyline hovering over misty mountains',
    score: 58,
    points: 3,
  },
  {
    name: 'Sam',
    initials: 'SA',
    color: 'orange',
    status: 'Done',
    prompt: 'A cloudy fantasy town with neon buildings and dramatic sunlight',
    score: 54,
    points: 2,
  },
];

const categories = ['Fantasy', 'Sci-fi', 'Funny / Absurd', 'Cinematic', 'Mystery', 'Cute / Cozy'];

const screens = [
  'Home',
  'Create Lobby',
  'Join Lobby',
  'Host Lobby',
  'Player Lobby',
  'Prompt',
  'Generating',
  'Results',
  'Leaderboard',
  'Components',
];

function App() {
  const [activeScreen, setActiveScreen] = useState(0);
  const [selectedRounds, setSelectedRounds] = useState(5);
  const [selectedPlayers, setSelectedPlayers] = useState(8);
  const [selectedCategory, setSelectedCategory] = useState('Sci-fi');
  const [ready, setReady] = useState(false);

  const goTo = (screenName) => setActiveScreen(screens.indexOf(screenName));

  const sharedProps = {
    goTo,
    selectedRounds,
    setSelectedRounds,
    selectedPlayers,
    setSelectedPlayers,
    selectedCategory,
    setSelectedCategory,
    ready,
    setReady,
  };

  const screenComponents = [
    <HomeScreen {...sharedProps} />,
    <CreateLobbyScreen {...sharedProps} />,
    <JoinLobbyScreen {...sharedProps} />,
    <LobbyHostScreen {...sharedProps} />,
    <LobbyPlayerScreen {...sharedProps} />,
    <RoundPromptScreen {...sharedProps} />,
    <GeneratingScreen {...sharedProps} />,
    <ResultsScreen {...sharedProps} />,
    <LeaderboardScreen {...sharedProps} />,
    <ComponentsScreen {...sharedProps} />,
  ];

  return (
    <main className="app-stage">
      {screenComponents[activeScreen]}
    </main>
  );
}

function Screen({ name, children, className = '' }) {
  return (
    <section className={`screen ${className}`} aria-label={name}>
      <Doodles />
      <div className="screen-label">{name}</div>
      {children}
    </section>
  );
}

function Doodles() {
  return (
    <div className="doodles" aria-hidden="true">
      <span className="blob blob-pink" />
      <span className="blob blob-sky" />
      <span className="blob blob-lime" />
      <span className="scribble scribble-one">WOW!</span>
      <span className="scribble scribble-two">?</span>
      <span className="scribble scribble-three">zap</span>
      {Array.from({ length: 26 }).map((_, index) => (
        <span key={index} className={`confetti c${(index % 6) + 1}`} />
      ))}
    </div>
  );
}

function Button({ children, color = 'lemon', onClick, wide = false }) {
  return (
    <button className={`button button-${color} ${wide ? 'wide' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

function Card({ children, className = '', color = 'white' }) {
  return <div className={`card card-${color} ${className}`}>{children}</div>;
}

function Field({ label, value, large = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} readOnly className={large ? 'large' : ''} />
    </label>
  );
}

function Pill({ children, color = 'white', selected = false, onClick }) {
  const Component = onClick ? 'button' : 'span';
  return (
    <Component className={`pill pill-${color} ${selected ? 'selected' : ''}`} onClick={onClick}>
      {children}
    </Component>
  );
}

function Avatar({ player, size = 'md' }) {
  return (
    <span className={`avatar avatar-${player.color} avatar-${size}`} title={player.name}>
      {player.initials}
    </span>
  );
}

function ImagePlaceholder({ label = 'Original AI Image', small = false, variant = 'city' }) {
  return (
    <div className={`image-placeholder ${small ? 'small' : ''} ${variant}`}>
      <div className="sun" />
      <div className="cloud cloud-a" />
      <div className="cloud cloud-b" />
      <div className="building b1" />
      <div className="building b2" />
      <div className="building b3" />
      <div className="image-sticker">{label}</div>
    </div>
  );
}

function PlayerStatusList({ mode = 'ready' }) {
  const stateFor = (player, index) => {
    if (mode === 'generate') return ['Submitted', 'Generating', 'Done', 'Done', 'Generating', 'Submitted'][index];
    if (mode === 'submitted') return ['Submitted', 'Submitted', 'Thinking', 'Submitted', 'Typing', 'Submitted'][index];
    return player.status;
  };

  return (
    <div className="status-list">
      {players.slice(0, 6).map((player, index) => (
        <div key={player.name} className="status-row">
          <Avatar player={player} size="sm" />
          <span>{player.name}</span>
          <em className={`status ${stateFor(player, index).toLowerCase().replaceAll(' ', '-')}`}>
            {stateFor(player, index)}
          </em>
        </div>
      ))}
    </div>
  );
}

function HomeScreen({ goTo }) {
  return (
    <Screen name="01 Landing / Home" className="home-screen">
      <div className="home-content">
        <section className="home-copy">
          <h1 className="logo-title" aria-label="Prompt Perfect">
            <span className="logo-prompt">Prompt</span>
            <span className="logo-perfect">Perfect</span>
          </h1>
          <p className="tagline">Guess the prompt. Recreate the image. Beat your friends.</p>
          <div className="button-row">
            <Button color="lemon" onClick={() => goTo('Create Lobby')}>Create Lobby</Button>
            <Button color="sky" onClick={() => goTo('Join Lobby')}>Join Lobby</Button>
          </div>
        </section>

        <Card className="hero-card">
          <Pill color="pink">Party prompt chaos</Pill>
          <div className="hero-media">
            <ImagePlaceholder />
            <Card color="lemon" className="mini-note">"floating city sunset?"</Card>
            <Card color="lime" className="mini-score">91% match</Card>
          </div>
          <p>
            Everyone writes a prompt. The weirdest AI remakes get revealed. Closest image
            wins the round.
          </p>
        </Card>
      </div>

      <section className="loop-grid" aria-label="Game loop">
        {[
          ['Guess', 'Describe the hidden prompt', 'pink'],
          ['Generate', 'AI remakes every guess', 'sky'],
          ['Compare', 'Reveal the wild results', 'lemon'],
          ['Win', 'Closest match gets points', 'lime'],
        ].map(([title, text, color], index) => (
          <Card key={title} color={color} className="loop-card">
            <span>{index + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </Card>
        ))}
      </section>
    </Screen>
  );
}

function CreateLobbyScreen({
  goTo,
  selectedRounds,
  setSelectedRounds,
  selectedPlayers,
  setSelectedPlayers,
  selectedCategory,
  setSelectedCategory,
}) {
  return (
    <Screen name="02 Create Lobby">
      <div className="page-heading">
        <h2>Create a Lobby</h2>
        <p>
          Set the table, invite the chaos goblins, and pick what kind of images everyone
          will try to reverse-prompt.
        </p>
      </div>

      <div className="lobby-content">
        <Card className="form-card create-form">
          <Field label="Host display name" value="Maya the Prompt Wizard" />

          <div className="selector-block">
            <h3>Number of rounds</h3>
            <div className="pill-row">
              {[3, 5, 7].map((rounds) => (
                <Pill
                  key={rounds}
                  color={selectedRounds === rounds ? 'lemon' : 'white'}
                  selected={selectedRounds === rounds}
                  onClick={() => setSelectedRounds(rounds)}
                >
                  {rounds}
                </Pill>
              ))}
            </div>
          </div>

          <div className="selector-block">
            <h3>Max players</h3>
            <div className="pill-row">
              {[4, 6, 8].map((maxPlayers) => (
                <Pill
                  key={maxPlayers}
                  color={selectedPlayers === maxPlayers ? 'sky' : 'white'}
                  selected={selectedPlayers === maxPlayers}
                  onClick={() => setSelectedPlayers(maxPlayers)}
                >
                  {maxPlayers}
                </Pill>
              ))}
            </div>
          </div>

          <div className="selector-block">
            <h3>Image category</h3>
            <div className="category-grid">
              {categories.map((category, index) => (
                <Pill
                  key={category}
                  color={['pink', 'sky', 'lime', 'lemon', 'violet', 'orange'][index]}
                  selected={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Pill>
              ))}
            </div>
          </div>

          <Button color="pink" wide onClick={() => goTo('Host Lobby')}>Create Room</Button>
        </Card>

        <Card color="lemon" className="room-preview">
          <h3>Your room will feel like...</h3>
          <div className="code-ticket">PXL-482</div>
          <div className="avatar-stack">
            {players.slice(0, 4).map((player) => <Avatar key={player.name} player={player} />)}
          </div>
          <p>Fast lobby. Big laughs. Five rounds of suspiciously confident prompting.</p>
        </Card>
      </div>
    </Screen>
  );
}

function JoinLobbyScreen({ goTo }) {
  return (
    <Screen name="03 Join Lobby">
      <div className="page-heading">
        <h2>Join the Room</h2>
        <p>
          Enter the code your host sent you, choose a name, and get ready to explain why
          your prompt definitely should have worked.
        </p>
      </div>

      <div className="lobby-content">
        <Card className="form-card join-form">
          <Field label="Lobby code" value="PXL-482" large />
          <Field label="Display name" value="Nova" />
          <Button color="sky" wide onClick={() => goTo('Player Lobby')}>Join Game</Button>
        </Card>

        <Card color="lime" className="join-mascot">
          <div className="mascot-face">
            <span>o</span>
            <span>o</span>
            <strong>___</strong>
          </div>
          <p>4 friends waiting<br />3 terrible guesses<br />1 glorious winner</p>
        </Card>
      </div>
    </Screen>
  );
}

function LobbyHostScreen({ goTo, selectedRounds, selectedPlayers, selectedCategory }) {
  return (
    <Screen name="04 Lobby Waiting Room - Host View" className="lobby-screen">
      <header className="lobby-header">
        <div className="code-wrap">
          <h2>Lobby Code</h2>
          <div className="big-code">PXL-482</div>
        </div>
        <Button color="sky">Copy Code</Button>
      </header>

      <div className="lobby-content">
        <Card className="player-panel">
          <div className="panel-title-row">
            <h3>Players</h3>
            <Pill color="lime">4 / {selectedPlayers} joined</Pill>
          </div>
          <PlayerStatusList />
        </Card>

        <Card color="lemon" className="host-controls">
          <h3>Host Controls</h3>
          <div className="setting-line"><span>Rounds</span><strong>{selectedRounds}</strong></div>
          <div className="setting-line"><span>Max players</span><strong>{selectedPlayers}</strong></div>
          <div className="setting-line"><span>Category</span><strong>{selectedCategory}</strong></div>
          <Button color="pink" wide onClick={() => goTo('Prompt')}>Start Game</Button>
        </Card>
      </div>
    </Screen>
  );
}

function LobbyPlayerScreen({ ready, setReady }) {
  return (
    <Screen name="05 Lobby Waiting Room - Player View" className="lobby-screen">
      <header className="lobby-header player">
        <div className="code-wrap">
          <h2>Lobby Code</h2>
          <div className="big-code">PXL-482</div>
        </div>
        <Card color="sky" className="waiting-card">Waiting for host to start...</Card>
      </header>

      <div className="lobby-content">
        <Card className="player-panel player-only">
          <div className="panel-title-row">
            <h3>Players</h3>
            <Pill color="lime">4 / 8 joined</Pill>
          </div>
          <PlayerStatusList />
        </Card>

        <Card color={ready ? 'lime' : 'orange'} className="ready-toggle-card">
          <h3>{ready ? 'You are ready!' : 'Ready up?'}</h3>
          <p>No host controls here. Just vibes, names, and mild dread.</p>
          <Button color={ready ? 'lemon' : 'lime'} wide onClick={() => setReady(!ready)}>
            {ready ? 'Set Waiting' : 'Ready'}
          </Button>
        </Card>
      </div>
    </Screen>
  );
}

function RoundPromptScreen({ goTo }) {
  return (
    <Screen name="06 Round Prompt Screen" className="round-screen">
      <div className="round-top">
        <h2>Round 1 of 5</h2>
        <div className="timer">00:48</div>
      </div>

      <div className="round-content">
        <ImagePlaceholder label="Original AI image - prompt hidden" />

        <div className="round-sidebar">
          <Card className="prompt-card">
            <h3>Write the prompt that could have created this image.</h3>
            <textarea
              readOnly
              value="A glowing sci-fi city floating above the clouds at sunset, cinematic lighting"
              aria-label="Prompt guess"
            />
            <Button color="pink" wide onClick={() => goTo('Generating')}>Submit Prompt</Button>
          </Card>

          <Card className="submission-panel">
            <h3>Submissions</h3>
            <PlayerStatusList mode="submitted" />
          </Card>
        </div>
      </div>
    </Screen>
  );
}

function GeneratingScreen({ goTo }) {
  return (
    <Screen name="07 Generating / Waiting Screen" className="generating-screen">
      <div className="generating-content">
        <Card className="generating-main">
          <ImagePlaceholder label="Original target" small />
          <div className="spinner-wrap" aria-hidden="true">
            <div className="spinner-ring" />
            <div className="spinner-face">AI</div>
          </div>
          <h2>Generating everyone's guesses...</h2>
          <p>The machine is drawing six confident interpretations of one very suspicious prompt.</p>
          <Button color="lemon" onClick={() => goTo('Results')}>Reveal Results</Button>
        </Card>

        <Card className="generation-status">
          <h3>Player Status</h3>
          <PlayerStatusList mode="generate" />
        </Card>
      </div>
    </Screen>
  );
}

function ResultsScreen({ goTo }) {
  const ranked = [...players].sort((a, b) => b.score - a.score);

  return (
    <Screen name="08 Round Results Screen" className="results-screen">
      <aside className="original-panel">
        <ImagePlaceholder label="Original image" small />
        <Card color="lemon" className="original-prompt">
          <h3>Original prompt revealed</h3>
          <p>A glowing sci-fi city floating above the clouds at sunset, cinematic lighting.</p>
        </Card>
        <Button color="pink" onClick={() => goTo('Leaderboard')}>Final Scores</Button>
      </aside>

      <section className="result-grid">
        <div className="results-heading">
          <h2>Maya wins the round!</h2>
          <Pill color="lime">Closest match: 91%</Pill>
        </div>
        {ranked.map((player, index) => (
          <Card key={player.name} className={`result-card ${index === 0 ? 'winner' : ''}`}>
            {index === 0 && (
              <div className="winner-badge">
                <span className="sparkle s1">✨</span>
                Round Winner
                <span className="sparkle s2">✨</span>
              </div>
            )}
            <div className="result-image">
              <ImagePlaceholder label="Generated guess" small variant={index % 2 === 0 ? 'city' : 'cozy'} />
            </div>
            <div className="result-content">
              <div className="result-player">
                <Avatar player={player} />
                <div>
                  <h3>{player.name}</h3>
                  <span>{player.score}% similarity</span>
                </div>
              </div>
              <p className="result-prompt-bubble">"{player.prompt}"</p>
            </div>
          </Card>
        ))}
      </section>
    </Screen>
  );
}

function LeaderboardScreen({ goTo }) {
  const ranked = [...players].sort((a, b) => b.points - a.points);

  return (
    <Screen name="09 Final Leaderboard Screen" className="leaderboard-screen">
      <section className="celebration">
        <h2>Maya is Prompt Perfect!</h2>
        <p>Five rounds, sixteen questionable nouns, one champion of visual reasoning.</p>
        <div className="trophy-card">
          <Avatar player={ranked[0]} size="lg" />
          <strong>1st Place</strong>
          <span>{ranked[0].points} total points</span>
        </div>
        <div className="button-row centered">
          <Button color="lemon" onClick={() => goTo('Prompt')}>Play Again</Button>
          <Button color="sky" onClick={() => goTo('Home')}>New Lobby</Button>
        </div>
      </section>

      <div className="leaderboard-sidebar">
        <Card className="leaderboard-list">
          <h3>Final Leaderboard</h3>
          {ranked.map((player, index) => (
            <div key={player.name} className={`leader-row place-${index + 1}`}>
              <span className="rank">{index + 1}</span>
              <Avatar player={player} />
              <strong>{player.name}</strong>
              <em>{player.points} pts</em>
            </div>
          ))}
        </Card>

        <Card color="pink" className="round-history">
          <h3>Round History</h3>
          <div><strong>R1</strong><span>Maya won with 91%</span></div>
          <div><strong>R2</strong><span>Jax won with 88%</span></div>
          <div><strong>R3</strong><span>Priya won with 82%</span></div>
        </Card>
      </div>
    </Screen>
  );
}

function ComponentsScreen({ players }) {
  return (
    <Screen name="10 Components Library" className="components-screen">
      <div className="page-heading">
        <h2>Components Library</h2>
        <p>Reusable UI elements for Prompt Perfect.</p>
      </div>

      <div className="components-grid">
        <div className="component-section">
          <h3>Buttons</h3>
          <div className="component-row">
            <Button color="pink">Primary Pink</Button>
            <Button color="lemon">Primary Lemon</Button>
            <Button color="sky">Secondary Sky</Button>
            <Button color="lime">Secondary Lime</Button>
          </div>
        </div>

        <div className="component-section">
          <h3>Inputs & Selectors</h3>
          <Card className="component-card">
            <Field label="Text input" value="A glowing sci-fi city" />
            
            <div className="selector-block" style={{ marginTop: '24px' }}>
              <h4>Number selector</h4>
              <div className="pill-row">
                <Pill color="lemon" selected>3</Pill>
                <Pill color="white">5</Pill>
                <Pill color="white">7</Pill>
              </div>
            </div>

            <div className="selector-block" style={{ marginTop: '24px' }}>
              <h4>Category selector</h4>
              <div className="category-grid">
                <Pill color="pink" selected>Fantasy</Pill>
                <Pill color="sky">Sci-Fi</Pill>
                <Pill color="lime">Realism</Pill>
                <Pill color="orange">Surreal</Pill>
              </div>
            </div>
          </Card>
        </div>

        <div className="component-section">
          <h3>Lobby Elements</h3>
          <div className="component-row" style={{ alignItems: 'flex-start' }}>
            <Card color="sky" className="component-card" style={{ width: '200px' }}>
              <h4>Lobby code card</h4>
              <div className="code-ticket" style={{ marginTop: '12px' }}>PXL-482</div>
            </Card>

            <Card className="component-card" style={{ flex: 1 }}>
              <h4>Player avatar & status</h4>
              <div className="status-row" style={{ marginTop: '16px' }}>
                <Avatar player={players[0]} />
                <div className="status-info">
                  <strong>{players[0].name}</strong>
                  <em className="status-pill wait">Waiting</em>
                </div>
              </div>
              <div className="status-row" style={{ marginTop: '16px' }}>
                <Avatar player={players[1]} />
                <div className="status-info">
                  <strong>{players[1].name}</strong>
                  <em className="status-pill ready">Ready</em>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="component-section">
          <h3>Game Cards</h3>
          <div className="component-row" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h4>Original image card</h4>
              <ImagePlaceholder label="Original image" small />
            </div>

            <div style={{ flex: 1 }}>
              <h4>Prompt input panel</h4>
              <Card className="prompt-card">
                <textarea readOnly value="A glowing sci-fi city" aria-label="Prompt guess" style={{ height: '80px', fontSize: '18px' }} />
                <Button color="pink" wide>Submit</Button>
              </Card>
            </div>
          </div>
        </div>

        <div className="component-section">
          <h3>Results & Badges</h3>
          <div className="component-row" style={{ alignItems: 'flex-start' }}>
            <Card className="result-card" style={{ width: '100%' }}>
              <div className="winner-badge">✨ Round Winner ✨</div>
              <div className="result-image"><ImagePlaceholder small /></div>
              <div className="result-content">
                <div className="result-player">
                  <Avatar player={players[2]} />
                  <div>
                    <strong>{players[2].name}</strong>
                    <span className="match-score">91% match</span>
                  </div>
                </div>
                <div className="result-prompt-bubble">
                  "floating city sunset?"
                </div>
              </div>
            </Card>

            <Card className="component-card" style={{ flex: 1 }}>
              <h4>Leaderboard row</h4>
              <div className="leader-row place-1" style={{ marginTop: '16px' }}>
                <span className="rank">1</span>
                <Avatar player={players[0]} />
                <strong>{players[0].name}</strong>
                <em>240 pts</em>
              </div>

              <h4 style={{ marginTop: '24px' }}>Similarity score badge</h4>
              <Card color="lime" className="mini-score" style={{ position: 'relative', marginTop: '16px', display: 'inline-block' }}>91% match</Card>

              <h4 style={{ marginTop: '24px' }}>Round header</h4>
              <div className="round-top" style={{ position: 'relative', margin: '16px 0 0' }}>
                <h2>Round 1</h2>
                <div className="timer">00:48</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Screen>
  );
}

createRoot(document.getElementById('root')).render(<App />);
