<template>
    <div v-if="url" class="input-group" style="width: 100%;">
        <iframe id="url-iframe" :src="url" style="width: 100%; height: calc(75vh);"></iframe>
    </div>
    <div v-else>
        <div class="d-flex justify-center">
            <v-subheader class="text-center">No input url available</v-subheader>
        </div>
    </div>
</template>

<script>
export default {
    props:{
        url: {
            type: String,
            default: function () {
                return null
            },
        }
    },
}
</script>