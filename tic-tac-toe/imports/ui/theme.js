import { createTheme } from '@mui/material/styles';

/**
 * MUI Theme Configuration
 *
 * This theme showcases the key areas of MUI's createTheme API:
 * - palette: primary, secondary, background, and text colors
 * - typography: font family, heading weights and sizes
 * - shape: global border radius
 * - components: per-component style overrides and default props
 *
 * Docs: https://mui.com/material-ui/customization/theming/
 */
const theme = createTheme({
  palette: {
    primary: {
      light: '#8e99d4',
      main: '#5c6bc0',
      dark: '#3f4fa0',
      contrastText: '#ffffff',
    },
    secondary: {
      light: '#ff9a76',
      main: '#ff7043',
      dark: '#c63f17',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f0f1f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a237e',
      secondary: '#5c6bc0',
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderTop: '3px solid #5c6bc0',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, #5c6bc0 0%, #8e99d4 100%)',
        },
      },
    },
  },
});

export default theme;
