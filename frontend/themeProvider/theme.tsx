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
      main: '#00897B',        // verde agua oscuro
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#4DB6AC',        // verde agua claro
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F1F8F6',     // fondo general (gris verdoso claro)
      paper: '#FFFFFF',       // tarjetas, formularios
    },
    text: {
      primary: '#1A1A1A',     // casi negro
      secondary: '#4DB6AC',   // verde agua suave
    },
  },
  typography: {
    fontFamily: `'Quicksand', sans-serif`, // o la que estés usando
  },
  shape: {
    borderRadius: 12, // bordes suaves
  },
});

export default theme;
