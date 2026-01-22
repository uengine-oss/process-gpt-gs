import { createVuetify } from 'vuetify';
import '@mdi/font/css/materialdesignicons.css';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import colors from 'vuetify/util/colors';

//DragScroll
import { VueDraggableNext } from 'vue-draggable-next'
//Data tables
// import { VDataTable } from 'vuetify/components/VDataTable';
import { BLUE_THEME, AQUA_THEME, PURPLE_THEME, GREEN_THEME, CYAN_THEME, ORANGE_THEME } from '@/theme/LightTheme';
import {
    DARK_BLUE_THEME,
    DARK_AQUA_THEME,
    DARK_ORANGE_THEME,
    DARK_PURPLE_THEME,
    DARK_GREEN_THEME,
    DARK_CYAN_THEME
} from '@/theme/DarkTheme';

// Material Design 기본 색상을 테마에 추가하는 헬퍼 함수
const addMaterialColors = (theme: any) => ({
    ...theme,
    colors: {
        ...theme.colors,
        red: colors.red.base,
        pink: colors.pink.base,
        purple: colors.purple.base,
        'deep-purple': colors.deepPurple.base,
        indigo: colors.indigo.base,
        blue: colors.blue.base,
        'light-blue': colors.lightBlue.base,
        cyan: colors.cyan.base,
        teal: colors.teal.base,
        green: colors.green.base,
        'light-green': colors.lightGreen.base,
        lime: colors.lime.base,
        yellow: colors.yellow.base,
        amber: colors.amber.base,
        orange: colors.orange.base,
        'deep-orange': colors.deepOrange.base,
        brown: colors.brown.base,
        grey: colors.grey.base,
        gray: colors.grey.base, // gray와 grey 둘 다 지원
        'blue-grey': colors.blueGrey.base,
        black: colors.shades.black,
        white: colors.shades.white
    }
});

export default createVuetify({
    components: {
        // VDataTable,
        draggable: VueDraggableNext,
      },
    directives,

    theme: {
        defaultTheme: 'BLUE_THEME',
        themes: {
            BLUE_THEME: addMaterialColors(BLUE_THEME),
            AQUA_THEME: addMaterialColors(AQUA_THEME),
            PURPLE_THEME: addMaterialColors(PURPLE_THEME),
            GREEN_THEME: addMaterialColors(GREEN_THEME),
            CYAN_THEME: addMaterialColors(CYAN_THEME),
            ORANGE_THEME: addMaterialColors(ORANGE_THEME),
            DARK_BLUE_THEME: addMaterialColors(DARK_BLUE_THEME),
            DARK_AQUA_THEME: addMaterialColors(DARK_AQUA_THEME),
            DARK_ORANGE_THEME: addMaterialColors(DARK_ORANGE_THEME),
            DARK_PURPLE_THEME: addMaterialColors(DARK_PURPLE_THEME),
            DARK_GREEN_THEME: addMaterialColors(DARK_GREEN_THEME),
            DARK_CYAN_THEME: addMaterialColors(DARK_CYAN_THEME)
        }
    },
    defaults: {
        VCard: {
            rounded: 'xl'
        },
        VTextField: {
            variant: 'outlined',
            density: 'comfortable',
            color: 'primary'
        },
        VStepper: {
            variant: 'outlined',
            density: 'comfortable',
            color: 'primary'
        },
        VTextarea: {
            variant: 'outlined',
            density: 'comfortable',
            color: 'primary'
        },
        VSelect: {
            variant: 'outlined',
            density: 'comfortable',
            color: 'primary'
        },
        VListItem: {
            minHeight: '45px'
        },
        VTooltip: {
            location: 'top'
        }
    }
});
