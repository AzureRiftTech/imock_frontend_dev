import { createTheme } from '@mui/material/styles';

// Define the primary purple/violet colors
const primaryMain = '#7b1fa2'; // Purple 700
const primaryLight = '#ae52d4';
const primaryDark = '#4a0072';

const secondaryMain = '#d500f9'; // Purple A400

export const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: primaryMain,
      light: primaryLight,
      dark: primaryDark,
    },
    secondary: {
      main: secondaryMain,
    },
    ...(mode === 'dark' ? {
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
    } : {
      background: {
        default: '#f5f5f5',
        paper: '#ffffff',
      },
    }),
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});
