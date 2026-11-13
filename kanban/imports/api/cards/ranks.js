// Cards in a column are sorted by a float `rank`. A moved card takes the
// midpoint between its new neighbours, so a move is a single update; once the
// gap between two neighbours gets too small the column is renumbered.
export const rankBetween = (previous, next) => {
  if (previous === undefined && next === undefined) return 0;
  if (previous === undefined) return next - 1;
  if (next === undefined) return previous + 1;
  return (previous + next) / 2;
};

export const needsRenumbering = (previous, next) =>
  previous !== undefined && next !== undefined && next - previous < 1e-6;
