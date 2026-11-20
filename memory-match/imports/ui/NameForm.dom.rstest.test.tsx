import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, rs, test } from '@rstest/core';
import React from 'react';

import { NameForm } from './NameForm';

test('submits trimmed accessible player name', async () => {
  const onStart = rs.fn();
  const user = userEvent.setup();
  render(<NameForm onStart={onStart} />);

  await user.type(screen.getByLabelText('Player name'), '  Ada  ');
  await user.click(screen.getByRole('button', { name: 'Start game' }));

  expect(onStart).toHaveBeenCalledWith('Ada');
});

test('shows useful validation instead of submitting empty name', async () => {
  const onStart = rs.fn();
  const user = userEvent.setup();
  render(<NameForm onStart={onStart} />);
  await user.click(screen.getByRole('button', { name: 'Start game' }));
  expect(screen.getByRole('alert').textContent).toMatch(/at least 2/);
  expect(onStart).not.toHaveBeenCalled();
});
