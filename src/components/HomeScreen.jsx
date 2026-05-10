import React from 'react';
import { Screen, Button, Card, Pill } from './UI.jsx';

export function HomeScreen({ goTo }) {
  return (
    <Screen name="Home" className="home-screen">
      <div className="home-content">
        <section className="home-copy">
          <h1 className="logo-title" aria-label="Prompt Perfect">
            <span className="logo-prompt">Prompt</span>
            <span className="logo-perfect">Perfect</span>
          </h1>
          <p className="tagline">Guess the prompt. Recreate the image. Beat your friends.</p>
          <div className="button-row">
            <Button color="lemon" onClick={() => goTo('createLobby')}>Create Lobby</Button>
            <Button color="sky" onClick={() => goTo('joinLobby')}>Join Lobby</Button>
          </div>
        </section>
        <Card className="hero-card">
          <Pill color="pink">Party prompt chaos</Pill>
          <div className="hero-media">
            <div className="image-placeholder">
              <div className="sun" />
              <div className="cloud cloud-a" />
              <div className="cloud cloud-b" />
              <div className="building b1" />
              <div className="building b2" />
              <div className="building b3" />
              <div className="image-sticker">Original AI Image</div>
            </div>
            <Card color="lemon" className="mini-note">"floating city sunset?"</Card>
            <Card color="lime" className="mini-score">91% match</Card>
          </div>
          <p>Everyone writes a prompt. The weirdest AI remakes get revealed. Closest image wins the round.</p>
        </Card>
      </div>
      <section className="loop-grid" aria-label="Game loop">
        {[
          ['Guess', 'Describe the hidden prompt', 'pink'],
          ['Generate', 'AI remakes every guess', 'sky'],
          ['Compare', 'Reveal the wild results', 'lemon'],
          ['Win', 'Closest match gets points', 'lime'],
        ].map(([title, text, color], i) => (
          <Card key={title} color={color} className="loop-card">
            <span>{i + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </Card>
        ))}
      </section>
    </Screen>
  );
}
