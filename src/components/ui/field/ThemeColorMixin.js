/**
 * 테마 색상 관리를 위한 간단한 믹스인
 * 컴포넌트에서 간편하게 테마 색상을 사용할 수 있습니다.
 */
export default {
    data() {
        return {
            themeColor: '#0085DB' // 기본 색상
        };
    },

    methods: {
        /**
         * 로컬스토리지에서 테마 색상 로드
         */
        loadThemeColor() {
            try {
                const savedSettings = JSON.parse(localStorage.getItem('userSettings') ?? '{}');
                this.themeColor = savedSettings.themeColorCode || '#0085DB';
            } catch (e) {
                console.error('테마 색상 로드 오류:', e);
            }
        },

        /**
         * 16진수 색상 코드를 RGBA로 변환
         * @param {string} hex - 16진수 색상 코드 (#RRGGBB)
         * @param {number} alpha - 투명도 (0-1)
         * @returns {string} - rgba 형식의 색상 문자열
         */
        hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
    },

    created() {
        this.loadThemeColor();
    }
}; 