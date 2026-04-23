const AVATAR_COLORS = [
  '#e45735', '#5856d6', '#34c759', '#ff9500', '#007aff',
  '#af52de', '#ff2d55', '#5ac8fa', '#ff3b30', '#30b0c7',
];

export function getInitials(contact) {
  const first = (contact.firstName || '')[0] || '';
  const last = (contact.lastName || '')[0] || '';
  return (first + last).toUpperCase() || '?';
}

export function getFullName(contact) {
  return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
}

export function getAvatarColor(contact) {
  const name = getFullName(contact);
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function groupContactsByLetter(contacts) {
  const groups = {};
  contacts.forEach(contact => {
    const letter = (contact.firstName || '?')[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(contact);
  });
  return Object.keys(groups)
    .sort()
    .map(letter => ({ letter, contacts: groups[letter] }));
}
