import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button': {
            WebkitAppearance: 'none',
            margin: 0,
          },
          '& input[type=number]': {
            MozAppearance: 'textfield',
          },
        }
      }
    }
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#ff8000',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#4DB6AC',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F1F8F6',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#4DB6AC',
    },
  },
  typography: {
    fontFamily: `'Quicksand', sans-serif`,
  },
  shape: {
    borderRadius: 12,
  },
});

export default theme;
