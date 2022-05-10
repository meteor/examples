module.exports = {
  content: ["./app/ui/**/*.{js,jsx}"],
  theme: {
    colors: {
      // Primary
      dodger: '#595DFF',
      burst: '#1B2448',
      orange: '#FF6A3E',
      white: '#FFFFFF',

      // Secondary
      manatee: '#8D91A3',
      rhino: '#292B5E',
      martinique: '#302C4D',
      violet: '#4746B9',
      lilac: '#EFF0F9',
      whisper: '#F9F9FD',
      porcelain: '#F3F4F5',
      vermilion: '#FF460F',
      green: '#2AAF62',
      paypal: '#FFBC32',
      black: '#000000',
      lightOrange: '#FFF3F0',

      // Etc
      transparent: 'transparent',
    },

    fontSize: {
      h1: ['36px', '1.2'],
      h2: ['28px', '1.2'],
      h3: ['24px', '1.2'],
      h4: ['20px', '1.2'],
      h5: ['16px', '1.2'],
      subtitle: ['20px', '1.4'],
      overline: ['12px', '1'],
      body: ['16px', '1'],
      p: ['16px', '1.5'],
      'p-big': ['18px', '1.5'],
      small: ['14px', '1.4'],
      caption: ['12px', '1.5'],
      button: ['14px', '1.5'],
      big: ['40px', '1.2'],
      huge: ['56px', '1.2'],
    },

    fontFamily: {
      display: ['Pulp Display', 'Arial', 'sans-serif'],
      body: ['Pulp Display', 'Arial', 'sans-serif'],
    },

    extend: {
      backgroundImage: {
        'bg-stars': "url('/images/bg-stars.svg')",
      },
    },
  },
  plugins: [],
}
