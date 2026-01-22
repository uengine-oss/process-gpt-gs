<template>
    <div class="paint-wave-container">
        <div class="wave-animation-wrapper" :style="containerStyle">
            <div class="base-layer"></div>
            <div class="wave-layer"></div>
            <div class="mixing-layer-first"></div>
            <div class="mixing-layer-second"></div>
            <div class="paint-flow-layer"></div>
            <div class="paint-streak-layer"></div>
            <div class="ripple-effect-layer"></div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PaintWaveAnimation',
    props: {
        size: {
            type: Number,
            default: 200
        },
        primaryColor: {
            type: String,
            default: '#1e90ff'
        },
        secondaryColor: {
            type: String,
            default: '#87ceeb'
        },
        isActive: {
            type: Boolean,
            default: false
        },
        isAudioPlaying: {
            type: Boolean,
            default: false
        },
        audioBars: {
            type: Array,
            default: () => []
        },
        volume: {
            type: Number,
            default: 0
        },
        threshold: {
            type: Number,
            default: 15
        }
    },
    computed: {
        containerStyle() {
            let animationSpeed = 'running';
            let scale = 1;
            let animationDuration = '';
            let brightness = 1;
            let saturation = 1;
            
            if (this.isActive) {
                // 로딩 상태: 빠른 애니메이션
                animationSpeed = 'running';
                scale = 1;
                animationDuration = 'fast';
            } else if (this.isAudioPlaying) {
                // 오디오 재생 상태: 매우 활동적인 크기 변화
                animationSpeed = 'running';
                const avgAudioLevel = this.audioBars.length > 0 
                    ? this.audioBars.reduce((a, b) => a + b, 0) / this.audioBars.length / 255
                    : 0;
                
                // 모바일 안정성을 위해 증폭 배율 조정 (1.0 ~ 1.8 범위)
                scale = 0.9 + (avgAudioLevel * 0.4);
                
                // 모바일 안정성을 위해 밝기와 채도 증가폭 조정
                brightness = 1 + (avgAudioLevel * 0.4);
                saturation = 1 + (avgAudioLevel * 0.6);
                
                animationDuration = 'normal';
            } else {
                // 기본 상태: 마이크 볼륨에 따른 애니메이션
                animationSpeed = this.volume > this.threshold ? 'running' : 'paused';
                const volumeScale = this.volume > this.threshold 
                    ? 0.9 + ((this.volume - this.threshold) / (100 - this.threshold)) * 0.1
                    : 0.9;
                scale = volumeScale;
                animationDuration = this.volume > this.threshold ? 'normal' : 'slow';
            }
            
            return {
                width: this.size + 'px',
                height: this.size + 'px',
                animationPlayState: animationSpeed,
                transform: `scale(${scale})`,
                transition: this.isAudioPlaying ? 'transform 0.1s ease-out, filter 0.1s ease-out' : 'transform 0.1s ease-in-out',
                filter: `brightness(${brightness}) saturate(${saturation})`,
                '--animation-speed': animationDuration,
                '--audio-intensity': this.isAudioPlaying ? (this.audioBars.length > 0 
                    ? this.audioBars.reduce((a, b) => a + b, 0) / this.audioBars.length / 255 
                    : 0) : 0
            };
        }
    }
};
</script>

<style scoped>
.paint-wave-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
}

.wave-animation-wrapper {
    position: relative;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.base-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, 
        #ffffff 0%,
        #f0f8ff 25%,
        #87ceeb 50%,
        #4682b4 75%,
        #1e90ff 100%);
    border-radius: 50%;
}

.wave-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
}

.wave-layer::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
        from 0deg,
        rgba(255, 255, 255, 0.8) 0deg,
        rgba(240, 248, 255, 0.6) 60deg,
        rgba(135, 206, 235, 0.4) 120deg,
        rgba(30, 144, 255, 0.6) 180deg,
        rgba(70, 130, 180, 0.8) 240deg,
        rgba(255, 255, 255, 0.8) 300deg,
        rgba(255, 255, 255, 0.8) 360deg
    );
    border-radius: 50%;
    animation: wave-swirl-rotation 8s linear infinite;
    transform-origin: 50% 50%;
}

.wave-layer::after {
    content: '';
    position: absolute;
    top: -25%;
    left: -25%;
    width: 150%;
    height: 150%;
    background: radial-gradient(ellipse at 30% 70%,
        rgba(255, 255, 255, 0.9) 0%,
        rgba(240, 248, 255, 0.7) 20%,
        rgba(135, 206, 235, 0.5) 40%,
        rgba(30, 144, 255, 0.3) 60%,
        transparent 80%
    );
    border-radius: 50%;
    animation: wave-flow-motion 6s ease-in-out infinite;
    transform-origin: 50% 50%;
}

.mixing-layer-first {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse 120% 80% at 60% 40%,
        rgba(255, 255, 255, 0.8) 0%,
        rgba(176, 224, 230, 0.6) 30%,
        rgba(30, 144, 255, 0.4) 60%,
        transparent 80%
    );
    border-radius: 50%;
    animation: paint-mixing-primary 5s ease-in-out infinite;
}

.mixing-layer-second {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse 100% 120% at 40% 60%,
        rgba(30, 144, 255, 0.7) 0%,
        rgba(135, 206, 235, 0.5) 35%,
        rgba(255, 255, 255, 0.3) 70%,
        transparent 90%
    );
    border-radius: 50%;
    animation: paint-mixing-secondary 7s ease-in-out infinite reverse;
}

.paint-flow-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
        radial-gradient(ellipse 60% 40% at 70% 30%,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(255, 255, 255, 0.4) 50%,
            transparent 70%),
        radial-gradient(ellipse 80% 60% at 30% 70%,
            rgba(30, 144, 255, 0.8) 0%,
            rgba(70, 130, 180, 0.5) 40%,
            transparent 70%);
    border-radius: 50%;
    animation: paint-flow-circulation 4s ease-in-out infinite alternate;
}

.paint-streak-layer {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(45deg,
        transparent 0%,
        rgba(255, 255, 255, 0.4) 30%,
        rgba(135, 206, 235, 0.3) 50%,
        rgba(30, 144, 255, 0.5) 70%,
        transparent 100%
    );
    animation: paint-streak-motion 6s ease-in-out infinite;
}

.ripple-effect-layer {
    position: absolute;
    top: 10%;
    left: 10%;
    width: 80%;
    height: 80%;
    background: radial-gradient(circle at center,
        rgba(255, 255, 255, 0.3) 0%,
        rgba(255, 255, 255, 0.1) 30%,
        transparent 60%
    );
    border-radius: 50%;
    animation: water-ripple-effect 3s ease-in-out infinite;
}

/* 상태별 애니메이션 속도 조절 */
.wave-animation-wrapper[style*="--animation-speed: ultra-fast"] .wave-layer::before {
    animation-duration: 1s;
}

.wave-animation-wrapper[style*="--animation-speed: ultra-fast"] .mixing-layer-first {
    animation-duration: 0.8s;
}

.wave-animation-wrapper[style*="--animation-speed: ultra-fast"] .mixing-layer-second {
    animation-duration: 1.2s;
}

.wave-animation-wrapper[style*="--animation-speed: ultra-fast"] .paint-flow-layer {
    animation-duration: 0.6s;
}

.wave-animation-wrapper[style*="--animation-speed: ultra-fast"] .paint-streak-layer {
    animation-duration: 0.4s;
}

.wave-animation-wrapper[style*="--animation-speed: ultra-fast"] .ripple-effect-layer {
    animation-duration: 0.5s;
}

.wave-animation-wrapper[style*="--animation-speed: fast"] .wave-layer::before {
    animation-duration: 3s;
}

.wave-animation-wrapper[style*="--animation-speed: fast"] .mixing-layer-first {
    animation-duration: 2s;
}

.wave-animation-wrapper[style*="--animation-speed: fast"] .mixing-layer-second {
    animation-duration: 2.5s;
}

.wave-animation-wrapper[style*="--animation-speed: fast"] .paint-flow-layer {
    animation-duration: 1.5s;
}

.wave-animation-wrapper[style*="--animation-speed: slow"] .wave-layer::before {
    animation-duration: 12s;
}

.wave-animation-wrapper[style*="--animation-speed: slow"] .mixing-layer-first {
    animation-duration: 8s;
}

.wave-animation-wrapper[style*="--animation-speed: slow"] .mixing-layer-second {
    animation-duration: 10s;
}

.wave-animation-wrapper[style*="--animation-speed: slow"] .paint-flow-layer {
    animation-duration: 6s;
}

@keyframes wave-swirl-rotation {
    0% {
        transform: rotate(0deg) scale(1);
    }
    100% {
        transform: rotate(360deg) scale(1);
    }
}

@keyframes wave-flow-motion {
    0%, 100% {
        transform: rotate(0deg) scale(0.8);
        opacity: 0.6;
    }
    50% {
        transform: rotate(180deg) scale(1.2);
        opacity: 0.9;
    }
}

@keyframes paint-mixing-primary {
    0%, 100% {
        transform: rotate(0deg) scale(0.9) skewX(0deg);
        opacity: 0.7;
    }
    33% {
        transform: rotate(120deg) scale(1.1) skewX(10deg);
        opacity: 0.9;
    }
    66% {
        transform: rotate(240deg) scale(0.95) skewX(-5deg);
        opacity: 0.8;
    }
}

@keyframes paint-mixing-secondary {
    0%, 100% {
        transform: rotate(0deg) scale(1) skewY(0deg);
        opacity: 0.6;
    }
    25% {
        transform: rotate(-90deg) scale(1.15) skewY(8deg);
        opacity: 0.8;
    }
    50% {
        transform: rotate(-180deg) scale(0.85) skewY(-8deg);
        opacity: 0.9;
    }
    75% {
        transform: rotate(-270deg) scale(1.05) skewY(4deg);
        opacity: 0.7;
    }
}

@keyframes paint-flow-circulation {
    0% {
        transform: scale(0.95) rotate(0deg);
        opacity: 0.8;
    }
    50% {
        transform: scale(1.1) rotate(180deg);
        opacity: 0.6;
    }
    100% {
        transform: scale(1.05) rotate(360deg);
        opacity: 0.9;
    }
}

@keyframes paint-streak-motion {
    0%, 100% {
        transform: rotate(0deg) scaleX(0.5);
        opacity: 0.3;
    }
    50% {
        transform: rotate(180deg) scaleX(1.5);
        opacity: 0.7;
    }
}

@keyframes water-ripple-effect {
    0%, 100% {
        transform: scale(0.8);
        opacity: 0.4;
    }
    50% {
        transform: scale(1.3);
        opacity: 0.8;
    }
}
</style> 