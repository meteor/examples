import React, { useId, useState, type FormEvent } from 'react';

export function NameForm({
  onStart,
}: {
  onStart(playerName: string): void | Promise<void>;
}) {
  const inputId = useId();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    const playerName = name.trim().replace(/\s+/g, ' ');
    if (playerName.length < 2) {
      setError('Player name needs at least 2 characters.');
      return;
    }
    setError('');
    void onStart(playerName);
  }

  return (
    <form className="name-form" onSubmit={submit}>
      <label htmlFor={inputId}>Player name</label>
      <div className="name-form__controls">
        <input
          id={inputId}
          maxLength={24}
          onChange={(event) => setName(event.currentTarget.value)}
          placeholder="Ada"
          value={name}
        />
        <button type="submit">Start game</button>
      </div>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
