import type { PaletteMode } from '@mui/material'
import { alpha, createTheme, type Theme } from '@mui/material/styles'

/**
 * A barra lateral é sempre "tinta" (ink), independente do modo claro/escuro —
 * é a âncora de identidade visual do produto, como em Linear/Vercel/Notion.
 * Só o conteúdo principal segue o palette.mode.
 */
export const INK = {
  bg: '#181510',
  bgAlt: '#211c15',
  border: 'rgba(242,238,228,0.09)',
  borderStrong: 'rgba(242,238,228,0.16)',
  text: '#F2EEE4',
  textMuted: '#9C9384',
  accent: '#E07A46',
  accentSoft: 'rgba(224,122,70,0.16)',
}

export const fontHeading = '"Fraunces", "Iowan Old Style", Georgia, serif'
export const fontBody = '"Manrope", "Segoe UI", Roboto, sans-serif'
export const fontMono = '"IBM Plex Mono", "SFMono-Regular", Consolas, Menlo, monospace'

interface Tokens {
  bgDefault: string
  bgPaper: string
  bgAlt: string
  border: string
  textPrimary: string
  textSecondary: string
  accent: string
  accentHover: string
  accentSoft: string
  success: string
  warning: string
  error: string
  pending: string
}

function tokens(mode: PaletteMode): Tokens {
  if (mode === 'light') {
    return {
      bgDefault: '#F6F3EC',
      bgPaper: '#FFFFFF',
      bgAlt: '#F1EDE2',
      border: '#E3DDCC',
      textPrimary: '#1C1B18',
      textSecondary: '#6B6459',
      accent: '#B5502A',
      accentHover: '#9C4220',
      accentSoft: alpha('#B5502A', 0.1),
      success: '#2F7D4F',
      warning: '#93690C',
      error: '#B23B3B',
      pending: '#45607D',
    }
  }
  return {
    bgDefault: '#15130F',
    bgPaper: '#1E1C17',
    bgAlt: '#262219',
    border: '#332D20',
    textPrimary: '#F2EEE4',
    textSecondary: '#AFA795',
    accent: '#E07A46',
    accentHover: '#EB8C5C',
    accentSoft: alpha('#E07A46', 0.18),
    success: '#4CAF7D',
    warning: '#D9A441',
    error: '#E27272',
    pending: '#8AA8C4',
  }
}

export function getTheme(mode: PaletteMode): Theme {
  const t = tokens(mode)

  return createTheme({
    palette: {
      mode,
      primary: { main: t.accent, dark: t.accentHover, contrastText: '#FFFFFF' },
      background: { default: t.bgDefault, paper: t.bgPaper },
      text: { primary: t.textPrimary, secondary: t.textSecondary },
      divider: t.border,
      success: { main: t.success },
      warning: { main: t.warning },
      error: { main: t.error },
      info: { main: t.pending },
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: fontBody,
      h4: { fontFamily: fontHeading, fontWeight: 600, letterSpacing: '-0.01em' },
      h5: { fontFamily: fontHeading, fontWeight: 600, letterSpacing: '-0.006em' },
      h6: { fontFamily: fontHeading, fontWeight: 600 },
      subtitle1: { fontWeight: 700, fontFamily: fontBody },
      subtitle2: {
        fontWeight: 700,
        fontFamily: fontBody,
        textTransform: 'uppercase',
        fontSize: '0.72rem',
        letterSpacing: '0.06em',
        color: t.textSecondary,
      },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: t.bgDefault,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          outlined: {
            borderColor: t.border,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: t.bgPaper,
            color: t.textPrimary,
            boxShadow: 'none',
            borderBottom: `1px solid ${t.border}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            border: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            paddingInline: 16,
          },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 600,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: t.border,
          },
          head: {
            fontWeight: 700,
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: t.textSecondary,
            backgroundColor: t.bgAlt,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
          input: {
            '&:-webkit-autofill': {
              WebkitTextFillColor: t.textPrimary,
              WebkitBoxShadow: `0 0 0 1000px ${t.bgDefault} inset`,
              transition: 'background-color 5000s ease-in-out 0s',
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 2.5,
            borderRadius: 2,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            minHeight: 44,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 14,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: '0.72rem',
            fontWeight: 600,
          },
        },
      },
    },
  })
}

/** Tokens crus (fora do Theme do MUI) para trechos que usam a paleta "ink" fixa da sidebar. */
export function getContentTokens(mode: PaletteMode): Tokens {
  return tokens(mode)
}
