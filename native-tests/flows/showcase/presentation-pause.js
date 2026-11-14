const pauseMs = Number(PAUSE_MS);

if (!Number.isInteger(pauseMs) || pauseMs < 250 || pauseMs > 5000) {
  throw new Error(`Invalid presentation pause: ${PAUSE_MS}`);
}

const deadline = Date.now() + pauseMs;

while (Date.now() < deadline) {
  // Showcase-only reading hold. Maestro has no fixed-duration wait command.
}
