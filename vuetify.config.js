import { defineVuetifyConfiguration } from 'vuetify-nuxt-module/custom-configuration'
import { fr, en } from 'vuetify/locale'

// https://vuetify-nuxt-module.netlify.app/guide/
export default defineVuetifyConfiguration({
  // labComponents: true, // VCalendar is imported directly in components that need it
  locale: {
    locale: 'en',
    fallback: 'en',
    messages: { en, fr }
  },
  date: {
    adapter: 'dayjs'
  },
  aliases: {
    VBtnPrimary: 'VBtn',
    VBtnSecondary: 'VBtn',
    VBtnError: 'VBtn'
  },
  defaults: {
    VAutocomplete: {
      rounded: 'lg',
      variant: 'outlined',
      menuIcon: 'mdi-chevron-down',
      baseColor: 'grey',
      density: 'compact'
    },
    VBtn: {
      variant: 'outlined',
      rounded: 'lg'
    },
    VBtnPrimary: {
      color: 'primary',
      class: ['bg-primary', 'font-weight-bold'],
      rounded: 'lg',
      elevation: 0
    },
    VBtnSecondary: {
      color: 'primary',
      variant: 'outlined',
      class: ['font-weight-bold'],
      rounded: 'lg'
    },
    VBtnError: {
      color: 'error',
      variant: 'outlined',
      class: ['btn--error', 'font-weight-bold'],
      rounded: 'lg'
    },
    VCard: {
      variant: 'outlined',
      class: ['bg-surface', 'rounded-lg']
    },
    VChip: {
      rounded: true
    },
    VDialog: {
      style: [
        {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0, 0, 0, 0.4)'
        }
      ]
    },
    VExpansionPanel: {
      elevation: 0,
      class: ['rounded-lg', 'elevation-0']
    },
    VList: {
      rounded: 'lg'
    },
    VSelect: {
      rounded: 'lg',
      variant: 'outlined',
      menuIcon: 'mdi-chevron-down',
      baseColor: 'grey',
      density: 'compact'
    },
    VTextField: {
      variant: 'outlined',
      rounded: 'lg',
      baseColor: 'grey',
      density: 'compact'
    },
    VTextarea: {
      variant: 'outlined',
      rounded: 'lg',
      baseColor: 'grey',
      density: 'compact'
    }
  },
  theme: {
    defaultTheme: 'crownTheme',
    themes: {
      crownTheme: {
        colors: {
          // BACKGROUND
          background: '#F9F9F9',
          'background-green': '#E6F1E6',
          'on-background': '#263027',
          'on-background-green': '#263027',
          // SURFACE
          surface: '#FFFFFF',
          'on-surface': '#263027',
          // GREYS
          black: '#263027', // Outdated
          grey: '#8E8E8E',
          'grey-2': '#787878',
          'on-grey': '#1D1D1B',
          'grey-ligthen-1': '#C7C7C7',
          'grey-ligthen-2': '#E9EAEC',
          'grey-ligthen-3': '#F8F8F8',
          'grey-ligthen-4': '#C5C7C9',
          'grey-darken-1': '#61615F',
          'grey-darken-2': '#737774',
          'grey-darken-3': '#4A4A48',
          'grey-darken-4': '#787878',
          // MAINS
          primary: '#1D1D1B',
          'primary-ligthen-1': '#363633',
          'primary-ligthen-2': '#F5FFFA',
          'primary-darken-1': '#0B7847',
          'primary-darken-2': '#0E240C',
          'primary-darken-3': '#009250',
          secondary: '#0B7847',
          // FEEDBACKS
          accent: '#00D072', // Outdated ?
          success: '#04B064', // Outdated ?
          'success-status': '#007C4A',
          warning: '#ED8713',
          error: '#FA1F1D',
          info: '#ED8713',
          // SECONDARY COLORS
          //green
          'green-darken-1': '#0E9F6E',
          green: '#35DE9E',
          'green-light': '#DEF7EC',
          'green-light-2': '#EBFFF7',
          'green-pastel': '#BCF0DA',
          'green-forest': 'rgba(142, 235, 198, 1)',
          'green-light-3': '#DDFBEE',
          // orange
          orange: '#F6F0D8',
          'orange-light': '#FFF1E3',
          'orange-light-2': '#FFF5EB',
          'on-orange': '#ED8713',
          'orange-2': '#FFA878',
          //red - 2024/07/18
          red: '#FDE8E8',
          'on-red': '#9B1C1C',
          'red-light': '#FDF2F2',
          // purple - 2024/07/18
          purple: '#EDEBFE',
          'on-purple': '#5521B5',
          'purple-2': '#AC94FA',
          'purple-3': '#CABFFD',
          'purple-light': '#F6F5FF',
          'purple-light-2': '#F3F2FF',
          // blue - 2024/07/18
          blue: '#D8DFF5',
          'blue-light': '#E9F5FF',
          'on-blue': '#314DA6',
          // pink - 2024/07/18
          pink: '#FCE8F3',
          'on-pink': '#99154B',
          // sky - 2024/07/18
          sky: '#DFF0FF',
          'on-sky': '#1E429F',
          'pale-aero': '#C3DDFD',
          // brown - 2024/07/18
          brown: '#FFE1CB',
          'on-brown': '#8C2300',
          // yellow 2024/07/18
          yellow: '#FDF6B2',
          'yellow-lighten-1': '#FDFFD2',
          'yellow-lighten-2': '#FEFFEA',
          'on-yellow': '#723B13',
          'yellow-2': '#FCE96A',
          // grass 2024/07/18
          grass: '#DEF7EC',
          'on-grass': '#03543F',
          // btn accent for drawer
          'btn-accent': '#00CE7C'
        },
        variables: {
          'high-emphasis-opacity': 1,
          'border-color': '#E9EAEC',
          'border-opacity': 1,
          'medium-emphasis-opacity': 1,
          'table-header-height': '32px'
        }
      }
    }
  }
})
