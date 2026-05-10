import React, { useState, useEffect } from 'react';
import { Screen, Button, Card } from './UI.jsx';

export function PromptScreen({ roundData, onSubmitPrompt, isHost, onForceGenerate }) {
  const [prompt, setPrompt] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    setPrompt('');
    setSubmitted(false);
    if (!roundData) return;
    const startedAt = roundData.startedAt || Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 250);
    return () => clearInterval(interval);
  }, [roundData]);

  const handleSubmit = () => {
    if (!prompt.trim() || submitted) return;
    setSubmitted(true);
    onSubmitPrompt(prompt.trim());
  };

  if (!roundData) return null;
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');

  return (
    <Screen name="Round Prompt" className="round-screen">
      <div className="round-top">
        <h2>Round {roundData.round} of {roundData.totalRounds}</h2>
        <div className={`timer ${timeLeft <= 10 ? 'timer-urgent' : ''}`}>{mins}:{secs}</div>
      </div>
      <div className="round-content">
        <div className="target-image-container">
          <img src={roundData.targetImageUrl} alt="Target" className="target-image" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="image-sticker-overlay">Recreate this image!</div>
        </div>
        <div className="round-sidebar">
          <Card className="prompt-card">
            <h3>{submitted ? '✅ Prompt Submitted!' : 'Write a prompt to recreate this image.'}</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={submitted}
              placeholder="A glowing sci-fi city floating above clouds at sunset..."
              aria-label="Prompt guess"
            />
            {!submitted ? (
              <Button color="pink" wide onClick={handleSubmit} disabled={!prompt.trim()}>Submit Prompt</Button>
            ) : (
              <Card color="lime" className="submitted-card">
                <p style={{ margin: 0, textAlign: 'center', fontWeight: 800 }}>Waiting for other players...</p>
              </Card>
            )}
          </Card>
          {isHost && submitted && (
            <Button color="orange" wide onClick={onForceGenerate}>Force Generate (Host)</Button>
          )}
        </div>
      </div>
    </Screen>
  );
}

export function GeneratingScreen({ roundData }) {
  return (
    <Screen name="Generating" className="generating-screen">
      <div className="generating-content">
        <Card className="generating-main">
          {roundData?.targetImageUrl && (
            <img src={roundData.targetImageUrl} alt="Target" className="gen-target-thumb" />
          )}
          <div className="spinner-wrap" aria-hidden="true">
            <div className="spinner-ring" />
            <div className="spinner-face">AI</div>
          </div>
          <h2>Generating everyone's guesses...</h2>
          <p>The machine is drawing everyone's interpretations. Hang tight!</p>
        </Card>
      </div>
    </Screen>
  );
}
