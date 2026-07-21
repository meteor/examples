import React from 'react';

const ACCENT_BY_EMERGENCY = {
  meteor: '#46bfd6',
  overheat: '#d9b24b',
  path: '#5cc4a1',
};

export function ShipArt({ emergency, turn, status }) {
  const accent = ACCENT_BY_EMERGENCY[emergency] ?? ACCENT_BY_EMERGENCY.meteor;
  const hull = status === 'lost' ? '#eb8b6b' : '#fffdf8';
  const engine = turn === 'copilot' ? '#d9b24b' : accent;

  return (
    <svg
      className="ship-art"
      viewBox="0 0 360 220"
      role="img"
      aria-labelledby="ship-art-title ship-art-desc"
    >
      <title id="ship-art-title">Meteor Escape mission ship</title>
      <desc id="ship-art-desc">
        A bright rescue ship banking through the meteor field while the crew cycles shield, cooling,
        and boost controls.
      </desc>

      <rect x="0" y="0" width="360" height="220" rx="24" fill="#fff6eb" />
      <circle cx="62" cy="56" r="6" fill="#46bfd6" />
      <circle cx="302" cy="42" r="8" fill="#5cc4a1" />
      <circle cx="280" cy="164" r="5" fill="#d9b24b" />
      <circle cx="82" cy="170" r="4" fill="#eb8b6b" />

      <path d="M58 146c24-36 72-58 138-64 58-5 108 10 144 28l-24 18c-36-12-80-18-122-14-42 4-82 18-116 40z" fill="#f8d5bf" />

      <path d="M104 122l58-44h52l44 44-38 28h-80z" fill={hull} />
      <path d="M152 78l14-20h46l18 20z" fill="#1f2b31" />
      <path d="M126 132h112l24 22H102z" fill="#1f2b31" />
      <path d="M118 146h124l-18 26h-88z" fill={accent} />
      <path d="M92 134l28-10-8 26-30 10z" fill="#1f2b31" />
      <path d="M270 134l-28-10 8 26 30 10z" fill="#1f2b31" />

      <circle cx="180" cy="104" r="18" fill="#0d2132" />
      <circle cx="180" cy="104" r="9" fill={accent} />
      <rect x="146" y="166" width="70" height="10" rx="5" fill="#fff6eb" />
      <path d="M110 176h24l-20 20H94z" fill={engine} className="ship-art__trail ship-art__trail--port" />
      <path d="M250 176h24l20 20h-20z" fill={engine} className="ship-art__trail ship-art__trail--starboard" />

      <text x="34" y="34" fill="#1f2b31" fontSize="18" fontWeight="700">
        Mission Deck
      </text>
      <text x="34" y="198" fill="#5f6a71" fontSize="13">
        Keep the ship flat and fast. Correct responses bank warp. Misses cost shield.
      </text>
    </svg>
  );
}
