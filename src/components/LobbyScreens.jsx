import React, { useState } from 'react';
import { Screen, Button, Card, Field, Pill } from './UI.jsx';

const categories = ['Fantasy', 'Sci-fi', 'Funny / Absurd', 'Cinematic', 'Mystery', 'Cute / Cozy'];
const catColors = ['pink', 'sky', 'lime', 'lemon', 'violet', 'orange'];

export function CreateLobbyScreen({ onCreateLobby, goTo }) {
  const [name, setName] = useState('');
  const [rounds, setRounds] = useState(5);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [category, setCategory] = useState('Sci-fi');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onCreateLobby(name.trim(), rounds, maxPlayers, category);
    setLoading(false);
  };

  return (
    <Screen name="Create Lobby">
      <div className="page-heading">
        <button className="back-button" onClick={() => goTo('home')}>← Back</button>
        <h2>Create a Lobby</h2>
        <p>Set the table, invite the chaos goblins, and pick what kind of images everyone will try to reverse-prompt.</p>
      </div>
      <div className="lobby-content">
        <Card className="form-card create-form">
          <Field label="Host display name" value={name} onChange={setName} placeholder="Enter your name" />
          <div className="selector-block">
            <h3>Number of rounds</h3>
            <div className="pill-row">
              {[3, 5, 7].map((r) => (
                <Pill key={r} color={rounds === r ? 'lemon' : 'white'} selected={rounds === r} onClick={() => setRounds(r)}>{r}</Pill>
              ))}
            </div>
          </div>
          <div className="selector-block">
            <h3>Max players</h3>
            <div className="pill-row">
              {[4, 6, 8].map((m) => (
                <Pill key={m} color={maxPlayers === m ? 'sky' : 'white'} selected={maxPlayers === m} onClick={() => setMaxPlayers(m)}>{m}</Pill>
              ))}
            </div>
          </div>
          <div className="selector-block">
            <h3>Image category</h3>
            <div className="category-grid">
              {categories.map((c, i) => (
                <Pill key={c} color={catColors[i]} selected={category === c} onClick={() => setCategory(c)}>{c}</Pill>
              ))}
            </div>
          </div>
          <Button color="pink" wide onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading ? 'Creating...' : 'Create Room'}
          </Button>
        </Card>
        <Card color="lemon" className="room-preview">
          <h3>Your room will feel like...</h3>
          <div className="preview-settings">
            <div className="preview-line"><span>Rounds</span><strong>{rounds}</strong></div>
            <div className="preview-line"><span>Players</span><strong>up to {maxPlayers}</strong></div>
            <div className="preview-line"><span>Category</span><strong>{category}</strong></div>
          </div>
          <p>Fast lobby. Big laughs. {rounds} rounds of suspiciously confident prompting.</p>
        </Card>
      </div>
    </Screen>
  );
}

export function JoinLobbyScreen({ onJoinLobby, goTo }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!code.trim() || !name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onJoinLobby(code.trim(), name.trim());
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <Screen name="Join Lobby">
      <div className="page-heading">
        <button className="back-button" onClick={() => goTo('home')}>← Back</button>
        <h2>Join the Room</h2>
        <p>Enter the code your host sent you, choose a name, and get ready.</p>
      </div>
      <div className="lobby-content">
        <Card className="form-card join-form">
          <Field label="Lobby code" value={code} onChange={setCode} large placeholder="ABC-123" />
          <Field label="Display name" value={name} onChange={setName} placeholder="Your name" />
          {error && <p style={{ color: 'var(--pink)', fontWeight: 800 }}>{error}</p>}
          <Button color="sky" wide onClick={handleJoin} disabled={loading || !code.trim() || !name.trim()}>
            {loading ? 'Joining...' : 'Join Game'}
          </Button>
        </Card>
        <Card color="lime" className="join-mascot">
          <div className="mascot-face">
            <span>o</span><span>o</span><strong>___</strong>
          </div>
          <p>4 friends waiting<br />3 terrible guesses<br />1 glorious winner</p>
        </Card>
      </div>
    </Screen>
  );
}
