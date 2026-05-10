import React from 'react';

export function Doodles() {
  return (
    <div className="doodles" aria-hidden="true">
      <span className="blob blob-pink" />
      <span className="blob blob-sky" />
      <span className="blob blob-lime" />
      <span className="scribble scribble-one">WOW!</span>
      <span className="scribble scribble-two">?</span>
      <span className="scribble scribble-three">zap</span>
      {Array.from({ length: 26 }).map((_, i) => (
        <span key={i} className={`confetti c${(i % 6) + 1}`} />
      ))}
    </div>
  );
}

export function Screen({ name, children, className = '' }) {
  return (
    <section className={`screen ${className}`} aria-label={name}>
      <Doodles />
      {children}
    </section>
  );
}

export function Button({ children, color = 'lemon', onClick, wide = false, disabled = false }) {
  return (
    <button className={`button button-${color} ${wide ? 'wide' : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Card({ children, className = '', color = 'white' }) {
  return <div className={`card card-${color} ${className}`}>{children}</div>;
}

export function Field({ label, value, onChange, large = false, placeholder = '' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
        className={large ? 'large' : ''}
        placeholder={placeholder}
      />
    </label>
  );
}

export function Pill({ children, color = 'white', selected = false, onClick }) {
  const C = onClick ? 'button' : 'span';
  return (
    <C className={`pill pill-${color} ${selected ? 'selected' : ''}`} onClick={onClick}>
      {children}
    </C>
  );
}

export function Avatar({ player, size = 'md' }) {
  return (
    <span className={`avatar avatar-${player.color} avatar-${size}`} title={player.name}>
      {player.initials}
    </span>
  );
}

export function PlayerStatusList({ players, mode = 'ready' }) {
  if (!players || players.length === 0) return null;
  return (
    <div className="status-list">
      {players.map((p) => (
        <div key={p.id} className="status-row">
          <Avatar player={p} size="sm" />
          <span>{p.name}</span>
          <em className={`status ${p.ready ? 'ready' : 'waiting'}`}>
            {mode === 'ready' ? (p.ready ? 'Ready' : 'Waiting') : mode}
          </em>
        </div>
      ))}
    </div>
  );
}
