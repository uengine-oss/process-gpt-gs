<template>
    <DmnChat :ownerInfo="ownerInfo" :dmnId="dmnId" />
</template>

<script>
import DmnChat from "@/components/DmnChat.vue";

export default {
    name: 'BusinessRuleLearning',
    components: {
        DmnChat
    },
    props: {
        ownerInfo: Object,
        dmnId: String
    }
}
</script>
