import React from 'react';

export function MeteorDropArt() {
  return (
    <svg
      className="meteor-drop-art"
      viewBox="0 0 720 360"
      role="img"
      aria-labelledby="meteor-drop-art-title meteor-drop-art-description"
    >
      <title id="meteor-drop-art-title">Meteor Drop game board</title>
      <desc id="meteor-drop-art-description">
        Coral and teal meteors falling toward a glowing seven-column orbital grid.
      </desc>

      <rect width="720" height="360" fill="#10252b" />
      <circle cx="90" cy="72" r="4" fill="#f7cf5b" />
      <circle cx="180" cy="42" r="3" fill="#56c7b0" />
      <circle cx="616" cy="66" r="5" fill="#f7cf5b" />
      <circle cx="674" cy="120" r="3" fill="#f6f1e8" />
      <path
        d="M24 282C154 214 278 232 360 274C446 318 574 314 696 244V360H24Z"
        fill="#173f46"
      />
      <path
        d="M72 266C180 236 278 246 360 286C445 327 545 320 650 278"
        fill="none"
        stroke="#3a6b70"
        strokeWidth="4"
      />

      <g transform="translate(182 108)">
        <rect width="356" height="210" rx="16" fill="#f6f1e8" />
        {Array.from({ length: 6 }, (_, row) =>
          Array.from({ length: 7 }, (_, column) => {
            const marker =
              row === 5 && [0, 1, 2].includes(column)
                ? '#f16b58'
                : row === 5 && [4, 5, 6].includes(column)
                  ? '#56c7b0'
                  : '#cbd8d6';

            return (
              <circle
                key={`${row}-${column}`}
                cx={28 + column * 50}
                cy={26 + row * 32}
                r="12"
                fill={marker}
              />
            );
          })
        )}
      </g>

      <g transform="translate(345 42)">
        <path d="M10 0L30 28L-10 28Z" fill="#f7cf5b" />
        <circle cx="10" cy="44" r="21" fill="#f16b58" />
        <path d="M-1 36L8 29L18 34L15 47L2 50Z" fill="#c94b40" />
      </g>
      <g transform="translate(456 64)">
        <path d="M9 0L28 26L-10 26Z" fill="#f7cf5b" />
        <circle cx="9" cy="41" r="19" fill="#56c7b0" />
        <path d="M-1 34L8 28L17 33L13 46L1 47Z" fill="#2a9c91" />
      </g>
    </svg>
  );
}
