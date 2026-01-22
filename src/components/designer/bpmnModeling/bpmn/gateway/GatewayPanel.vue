<template>
    <div>
        <DetailComponent
            :title="$t('GatewayPanel.gatewayDescriptionTitle')"
            :details="gatewayDescription"
        />
    </div>
</template>

<script>

    export default {
        name: 'gateway-panel',
        props: {
            element: Object,
        },
        data() {
            return {
                gatewayDescription: [
                    {
                        title: 'GatewayPanel.gatewayDescriptionSubTitle',
                    },
                    {
                        title: 'GatewayPanel.gatewayDescriptionSubTitle1'
                    },
                    {
                        title: 'GatewayPanel.gatewayDescriptionSubTitle2'
                    },
                    {
                        title: 'GatewayPanel.gatewayDescriptionSubTitle3'
                    },
                    {
                        title: 'GatewayPanel.gatewayDescriptionSubTitle4',
                        image: 'gatewayChange.gif'
                    }
                ]
            }
        },
        created: function () {
        },
        mounted: function () {
            console.log('gatewayType: ', this.element.$type);
        },
        computed: {},
        watch: {},
        methods: {}
    }
</script>


<style lang="scss" rel="stylesheet/scss">

</style>

