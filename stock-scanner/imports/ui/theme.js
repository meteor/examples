import { createTheme } from '@mui/material/styles';

export const stockTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#126b5c', contrastText: '#ffffff' },
    secondary: { main: '#315f88' },
    warning: { main: '#b86a16' },
    background: { default: '#f1f4f2', paper: '#fffefb' },
    text: { primary: '#18231e', secondary: '#53625c' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: [
      'Inter',
      'ui-sans-serif',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'sans-serif',
    ].join(', '),
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 800,
          minHeight: 48,
          textTransform: 'none',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: { minHeight: 52, fontSize: 16 },
        input: { paddingTop: 14, paddingBottom: 14 },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 800 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});
