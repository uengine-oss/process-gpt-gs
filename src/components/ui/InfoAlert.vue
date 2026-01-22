<template>
    <v-col v-if="infoDetail">
        <v-alert color="#2196F3" variant="outlined">
            <small style="white-space: pre-line; font-size:14px; line-height: 32px;"
            >{{ infoDetail }}
            </small>
        </v-alert>
    </v-col>
</template>

<script>
export default {
    name: 'InfoAlert',
    props: {
        howToUseInfo: {
            type: Object,
            default: null
        },
        chatInfo: {
            type: Object,
            default: null
        }
    },
    computed: {
        infoDetail() {
            // howToUseInfo 우선, 없으면 chatInfo 사용
            const info = this.howToUseInfo || this.chatInfo;
            
            if(info && info.text){
                const text = info.text;
                // 국제화 키가 존재하는지 확인
                const translated = this.$t(text);
                // 번역이 키 그대로 반환되면 하드코딩된 텍스트로 사용
                return translated !== text ? translated : text;
            }
            return '';
        }
    }
}
</script>