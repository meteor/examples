import React from 'react';

export function FlightDeckArt() {
  return (
    <svg
      className="flight-deck-art"
      viewBox="0 0 360 240"
      role="img"
      aria-labelledby="flight-deck-title flight-deck-desc"
    >
      <title id="flight-deck-title">Meteor Escape flight deck</title>
      <desc id="flight-deck-desc">
        A flat retro-space cockpit watching a meteor field while the warp drive charges.
      </desc>

      <rect x="0" y="0" width="360" height="240" rx="24" fill="#05121e" />
      <rect x="18" y="18" width="324" height="204" rx="18" fill="#0d2132" />

      <path
        d="M42 62c36-24 88-30 140-18 38 9 71 26 136 6v70c-53 25-101 28-144 17-43-10-82-9-132 14z"
        fill="#143a54"
      />
      <circle cx="102" cy="84" r="8" fill="#ffd166" className="meteor-fragment meteor-fragment--one" />
      <circle cx="164" cy="72" r="5" fill="#ff8a5b" className="meteor-fragment meteor-fragment--two" />
      <circle cx="258" cy="98" r="9" fill="#7ae7ff" className="meteor-fragment meteor-fragment--three" />

      <path d="M108 192h144l-22-38H130z" fill="#102838" />
      <path d="M144 154h72l-14-18h-44z" fill="#193a50" />
      <circle cx="180" cy="170" r="20" fill="#092436" />
      <circle cx="180" cy="170" r="10" fill="#7ae7ff" className="engine-pulse" />

      <rect x="58" y="146" width="52" height="34" rx="8" fill="#16354a" />
      <rect x="250" y="146" width="52" height="34" rx="8" fill="#16354a" />
      <rect x="72" y="158" width="24" height="8" rx="4" fill="#7ae7ff" />
      <rect x="264" y="158" width="24" height="8" rx="4" fill="#ff8a5b" />

      <text x="44" y="42" fill="#f6f7eb" fontSize="18" fontWeight="700">
        Flight Deck
      </text>
      <text x="44" y="204" fill="#b7c6d2" fontSize="13">
        Shield up. Warp coils ready. Crew on standby.
      </text>
    </svg>
  );
}
