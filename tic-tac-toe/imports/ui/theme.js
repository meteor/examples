import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#5c6bc0' },
    secondary: { main: '#ff7043' },
    background: { default: '#f5f5f5' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
});

export default theme;
