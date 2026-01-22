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
            borderCompletedAnimated: false,
        };
    },
    computed: {
        
    },
    methods: {
        animateBorder() {
            this.borderCompletedAnimated = true;
            setTimeout(() => {
                this.borderCompletedAnimated = false;
            }, 1000); // 1000밀리초 후 실행
        }
    }
};
</script>
  
<style>
.opacity {
    opacity: 0;
    transition: opacity 0.5s ease; /* 투명도가 변하는데 걸리는 시간 */
}
.progress-border{
    position: relative;
    border-radius: 10px;
    overflow: hidden;
}
.progress-border .progress-border-span:nth-child(1) {
    position: absolute;
    background: linear-gradient(to right, 
    rgba(129, 240, 255, 0.1),
    rgba(129, 240, 255, 0.3),
    rgba(21, 101, 192, 0.7)) !important;
    transition: width 0.1s;
    left: 0; top: 0; width: 0; height: 2px;
}
.progress-border .progress-border-span:nth-child(2) {
    position: absolute;
    background: linear-gradient(to bottom, #81D4FA, #4FC3F7);
    transition: height 0.1s linear 0.1s;
    right: 0; top: 0; width: 3px; height: 0;
}

.progress-border .progress-border-span:nth-child(3) {
    position: absolute;
    background: linear-gradient(to left,#4FC3F7, #29B6F6);
    transition: width 0.1s linear 0.2s;
    right: 0; bottom: 0; width: 0; height: 2px;
}

.progress-border .progress-border-span:nth-child(4) {
    position: absolute;
    background: linear-gradient(to top, #29B6F6, #0288D1);
    transition: height 0.1s linear 0.3s;
    left: 0; bottom: 0; width: 3px; height: 0;
}
.progress-border .progress-border-span:nth-child(5) {
    position: absolute;
    background: linear-gradient(to right, 
    rgba(21, 101, 192, 0.7),
    rgba(129, 240, 255, 0.3),
    rgba(129, 240, 255, 0.1)) !important;
    transition: width 0.1s linear 0.4s;
    left: 0; top: 0; width: 0; height: 2px;
}
.progress-border.animate .progress-border-span:nth-child(1) {width: 50%; margin-left:50%;}
.progress-border.animate .progress-border-span:nth-child(2) {height: 100%;}
.progress-border.animate .progress-border-span:nth-child(3) {width: 100%;}
.progress-border.animate .progress-border-span:nth-child(4) {height: 100%;}
.progress-border.animate .progress-border-span:nth-child(5) {width: 70%; margin-right:30%;}

</style>