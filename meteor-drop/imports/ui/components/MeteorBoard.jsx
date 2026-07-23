import React from 'react';
import { ChevronDown } from 'lucide-react';
import { BOARD_COLUMNS } from '../../api/games/engine';

function getCellLabel(marker, row, column) {
  const position = `Row ${row + 1}, column ${column + 1}`;
  if (marker === 'player') {
    return `${position}: coral meteor`;
  }

  if (marker === 'rival') {
    return `${position}: teal meteor`;
  }

  return `${position}: empty`;
}

export function MeteorBoard({
  board,
  winningCells,
  lastMove,
  interactive,
  availableColumns,
  onDrop,
}) {
  return (
    <div className="meteor-board-frame">
      <div className="meteor-board__drop-hint" aria-hidden="true">
        {Array.from({ length: BOARD_COLUMNS }, (_, column) => (
          <span key={column}>
            <ChevronDown size={18} strokeWidth={2.5} />
          </span>
        ))}
      </div>

      <div
        id="meteor-drop-board"
        className="meteor-board"
        role="grid"
        aria-label="Meteor Drop board"
        aria-rowcount="6"
        aria-colcount="7"
      >
        {board.map((marker, index) => {
          const row = Math.floor(index / BOARD_COLUMNS);
          const column = index % BOARD_COLUMNS;
          const winning = winningCells.includes(index);
          const newest = lastMove?.index === index;

          return (
            <div
              key={index}
              className={[
                'meteor-board__cell',
                winning ? 'is-winning' : '',
                newest ? 'is-newest' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role="gridcell"
              aria-label={getCellLabel(marker, row, column)}
              data-marker={marker ?? 'empty'}
            >
              {marker ? <span className="meteor-board__meteor" aria-hidden="true" /> : null}
            </div>
          );
        })}

      </div>

      <div className="meteor-board__column-targets" aria-label="Choose a column">
        {Array.from({ length: BOARD_COLUMNS }, (_, column) => {
          const label = `Drop meteor in column ${column + 1}`;

          return (
            <button
              key={column}
              className="meteor-board__column-target"
              type="button"
              aria-label={label}
              aria-controls="meteor-drop-board"
              disabled={!interactive || !availableColumns.includes(column)}
              onClick={() => onDrop(column)}
            >
              <span className="visually-hidden">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
