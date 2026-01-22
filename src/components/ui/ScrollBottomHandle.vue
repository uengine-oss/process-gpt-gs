<template>
</template>
<script>
  export default {
    components: {
    },
    props: {
    },
    data() {
        return {
            isAtBottom: true,
        };
    },
    watch: {
        filteredMessages() {
            if (this.isAtBottom) {
                this.scrollToBottom();
            } else {
                this.showNewMessage();
            }
        },
    },
    computed: {
        
    },
    methods: {
        scrollToBottom() {
            setTimeout(() => {
                if(this.$refs.scrollContainer) {
                    const container = this.$refs.scrollContainer.$el;
                    container.scrollTop = container.scrollHeight;
                }
            }, 300);
            // this.$nextTick(() => {
            //     const container = this.$refs.scrollContainer.$el;
            //     container.scrollTop = container.scrollHeight;
            // });
        },
        handleScroll() {
            if(this.$refs.scrollContainer) {
                const container = this.$refs.scrollContainer.$el;
                clearTimeout(this.scrollTimeout);
                this.scrollTimeout = setTimeout(() => {
                    const scrollPosition = Math.round(container.scrollTop + container.clientHeight) + 1;
                    const isAtBottom = scrollPosition >= container.scrollHeight;
                    this.isAtBottom = isAtBottom;
                }, 200);    
            }
            
        },
    }
};
</script>
  
<style>
</style>