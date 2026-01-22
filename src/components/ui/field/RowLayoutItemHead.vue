<template>
    <div>
        <v-row class="ma-0 pa-0 pl-4 pr-4 pt-2">
            <div>{{ "#" + (index+1) }}</div>
            <v-spacer></v-spacer>
            <v-btn @click="$emit('on_delete_item', index)" 
                density="compact" 
                icon="mdi-delete" 
                style="background-color: transparent;"
                variant="text"
            ></v-btn>
        </v-row>
    </div>
</template>

<script>
export default {
    name: "RowLayout",
    
    props: {
        index: Number
    },

    emits: [
        "on_delete_item"
    ],
}
</script>

<style lang="scss">

</style>
