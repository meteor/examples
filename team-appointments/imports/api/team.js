// The demo team. Every password is "demo": sign in as anyone from the header.
export const DEMO_PASSWORD = 'demo';

export const TEAM = [
  { username: 'maya', name: 'Maya Chen', color: '#2f6fdf', role: 'admin' },
  { username: 'leo', name: 'Leo Martin', color: '#2c9a5b', role: 'member' },
  { username: 'sara', name: 'Sara Ali', color: '#c2410c', role: 'member' },
  { username: 'tom', name: 'Tom Becker', color: '#7b45b5', role: 'viewer' },
];

// The pages of the app, each one a presence room: the header shows who is on
// the same page as you.
export const PAGES = ['calendar', 'list'];
export const roomOf = (page) => `page:${page}`;
