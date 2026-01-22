<template v-if="testRecord">
    <v-card class="pa-0 pr-0 mb-2" style="width: 100px; height: 100px; overflow: hidden; cursor: pointer;" variant="outlined" @click="handleCardClick">
        <v-card-title class="text-truncate" style="font-size: 12px;">{{ testRecord.name }}</v-card-title>
        <v-card-text class="pl-2 pr-2">
            <v-simple-table>
                <tbody>
                    <tr v-for="(value, key) in testRecord.workItem" :key="key" style="font-size: 10px;">
                        <td><strong>{{ key }}</strong></td>
                        <td>&nbsp;</td>
                        <td>{{ value }}</td>
                    </tr>
                </tbody>
            </v-simple-table>
        </v-card-text>
    </v-card>
    <v-icon v-if="!isLast" style="align-self: center;">mdi-chevron-right</v-icon>
</template>

<script>
export default {
    props: {
        testRecord: {
            type: Array,
            required: true
        },
        isLast: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    data: () => ({
    }),
    methods: {
        handleCardClick() {
            this.$emit('card-click', this.testRecord);
        }
    }
};
</script>
