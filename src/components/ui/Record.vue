<template>
    <v-dialog v-model="recordingMode" fullscreen>
        <div class="record-container">
            <v-btn class="record-close-btn" icon density="comfortable" @click="closeRecording"
                :style="!$globalState.state.isRightZoomed ? '' : 'top:10px; z-index: 9999;'"
            >
                <v-icon>mdi-close</v-icon>
            </v-btn>
            <div style="position: relative;">
               <!-- <div style="color: white;">{{ isAudioPlaying }}</div>  -->
                <!-- WebGL 지원 여부에 따른 조건부 렌더링 webglSupported -> 3D // !webglSupported -> 2D -->
                <!-- <ThreeWaveAnimation 
                    v-if="webglSupported"
                    :size="circleSize" 
                    :isActive="isLoading"
                    :isAudioPlaying="isAudioPlaying"
                    :audioBars="audioBars"
                    :volume="volume"
                    :threshold="threshold"
                /> -->
                <PaintWaveAnimation
                    :size="circleSize" 
                    :isActive="isLoading"
                    :isAudioPlaying="isAudioPlaying"
                    :audioBars="audioBars"
                    :volume="volume"
                    :threshold="threshold"
                />
            </div>
            <AudioStream
                @audio:start="startAudio"
                @audio:stop="stopAudio"
                @ai-audio:start="startAiAudio"
                @ai-audio:stop="stopAiAudio"
                @update:audioBars="updateAudioBars"
                @user-speaking="onUserSpeaking"
                :stopAudioStreamStatus="stopAudioStreamStatus"
                :chatRoomId="chatRoomId"
                :startAudioStream="isRecording"
            />
            <!-- <div v-if="!isAudioPlaying && !isLoading" class="chatgpt-waveform">
                <canvas ref="waveformCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
            </div>
            <div v-else-if="isLoading" class="chatgpt-waveform">
                <div style="color: white;">서버로부터 응답을 기다리는 중입니다
                    <span class="loading-dots">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                    </span>
                </div>
            </div> -->
            <div class="controls d-flex align-center">
                <v-btn v-if="!isRecording && !isAudioPlaying && !isLoading" @click="toggleRecording()" icon density="comfortable">
                    <Icons :icon="'sharp-mic'"  />
                </v-btn>
                <v-btn v-else-if="!sendRecordingStatus" @click="sendRecording()" icon density="comfortable">
                    <Icons :icon="'stop'"  />
                </v-btn>
                <v-btn v-else @click="stopAudioStream()" icon density="comfortable">
                    <Icons :icon="'stop'"  />
                </v-btn>
                <div style="color: white;">
                    <div v-if="isPCResponding">음성답변 진행중</div>
                    <div v-else-if="isUserSpeaking">음성 인식 진행중....</div>
                    <div v-else-if="isRecording">음성 감지중</div>
                    <div v-else></div>
                </div>
            </div>
        </div>
    </v-dialog>
</template>

<script>
import { Icon } from '@iconify/vue';
import AudioStream from './AudioStream.vue';
import { getPrimary } from '@/utils/UpdateColors';
// 기존 오디오 스트림 애니메이션(PaintWaveAnimation)
import PaintWaveAnimation from './PaintWaveAnimation.vue';
import ThreeWaveAnimation from './ThreeWaveAnimation.vue';

export default {
    components: {
        Icon,
        AudioStream,
        PaintWaveAnimation,
        ThreeWaveAnimation,
    },
    props: {
        recordingMode: Boolean,
        chatRoomId: String
    },
    data() {
        return {
            isRecording: false,
            isLoading: false,
            isAudioPlaying: false,
            isPCResponding: false, // PC 응답 상태 추가
            stopAudioStreamStatus: false,
            sendRecordingStatus: false,
            audioBars: [],
            canvasWidth: Math.floor(window.innerWidth * 0.96),
            canvasHeight: 100,
            volume: 0,
            threshold: 15,
            webglSupported: false, // WebGL 지원 여부
            isUserSpeaking: false, // 사용자 음성 감지 상태
        };
    },

    mounted() {
        this.checkWebGLSupport();
    },
    methods: {
        checkWebGLSupport() {
            try {
                const canvas = document.createElement('canvas');
                let gl = canvas.getContext('webgl2');
                let version = '';
                
                if (gl) {
                    version = 'WebGL 2.0';
                } else {
                    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    if (gl) {
                        version = 'WebGL 1.0';
                    }
                }
                
                if (gl) {
                    // 추가 검증: 실제로 렌더링이 가능한지 확인
                    const supported = gl.getParameter(gl.VERSION);
                    
                    // GPU 정보도 출력
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    if (debugInfo) {
                        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    }
                    
                    this.webglSupported = true;
                } else {
                    this.webglSupported = false;
                }
            } catch (e) {
                this.webglSupported = false;
            }
        },
        
        updateAudioBars(dataArray) {
            this.audioBars = dataArray;
            if (dataArray && dataArray.length > 0) {
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                this.volume = sum / dataArray.length;
            } else {
                this.volume = 0;
            }
        },
        stopAudioStream() {
            this.stopAudioStreamStatus = true;
            this.sendRecordingStatus = false;
            this.isRecording = false;
        },
        toggleRecording() {
            this.isRecording = true;
            this.stopAudioStreamStatus = false;
            this.sendRecordingStatus = false;
        },
        sendRecording() {
            this.isRecording = false;
            this.stopAudioStreamStatus = true;
            this.sendRecordingStatus = true;
        },
        closeRecording() {
            this.$emit('close');
            this.EventBus.emit('instances-updated');
        },
        startAudio() {
            this.isAudioPlaying = true;
        },
        stopAudio() {
            this.isAudioPlaying = false;
            this.isRecording = false;
            this.isLoading = false;
            this.stopAudioStreamStatus = false;
            this.sendRecordingStatus = false;
            this.isUserSpeaking = false; // 사용자 음성 감지 상태 초기화
        },
        startAiAudio() {
            this.isPCResponding = true; // AI 답변 상태로 올바른 변수 사용
            this.isLoading = false; // 로딩 상태 해제
        },
        stopAiAudio() {
            this.isPCResponding = false; // AI 답변 종료
        },
        onUserSpeaking(isUserSpeaking) {
            this.isUserSpeaking = isUserSpeaking;
        },
    },
    computed: {
        circleSize() {
            if (this.volume < this.threshold) return 200;
            return 200 + ((this.volume - this.threshold) / (100 - this.threshold)) * 20;
        },
        containerStyle() {
            return {
                height: '100vh'
            };
        }
    }
};
</script>

<style scoped>
/* ===== GPT 답변 애니메이션 시작 */
@keyframes increaseHeight1 {
  0%, 100% {
    height: 30px;
  }
  50% {
    height: 60px;
  }
}

@keyframes increaseHeight2 {
  0%, 100% {
    height: 30px;
  }
  50% {
    height: 80px;
  }
}

@keyframes increaseHeight3 {
  0%, 100% {
    height: 30px;
  }
  50% {
    height: 100px;
  }
}

@keyframes increaseHeight4 {
  0%, 100% {
    height: 30px;
  }
  50% {
    height: 120px;
  }
}

.audio-bar-box {
    display: flex;
    align-items: flex-end;
    gap: 5px;
    position: relative; /* 상대 위치 설정 */
    height: 100px; /* 최대 높이 설정 */
    top: -160px;
}

.audio-bar {
    width: 50px;
    background-color: white;
    margin: 0 0 10px 0;
    border-radius: 50px;
    transform-origin: bottom; /* 변환의 기준점을 하단으로 설정 */
}

.gpt-animation1 {
    animation: increaseHeight1 0.7s infinite ease-in-out;
}

.gpt-animation2 {
    animation: increaseHeight2 0.7s infinite ease-in-out;
}

.gpt-animation3 {
    animation: increaseHeight3 0.7s infinite ease-in-out;
}

.gpt-animation4 {
    animation: increaseHeight4 0.7s infinite ease-in-out;
}


/* ===== GPT 답변 애니메이션 끝 */


@keyframes breathe {
    0%, 100% {
        transform: scale(0.97);  /* 기본 크기 */
        opacity: 1;  /* 약간 투명 */
    }
    50% {
        transform: scale(1.1);  /* 20% 더 크게 */
        opacity: 0.9;  /* 완전 불투명 */
    }
}

@keyframes rotate {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

@keyframes move-position {
    0%, 100% {
        top: 120px;
    }
    25% {
        top: 110px;
    }
    50% {
        top: 130px;
    }
    75% {
        top: 110px;
    }
}

@keyframes move-child {
    0%, 100% {
        top: 0px;
        left: 30px;
    }
    50% {
        top: 60px;
        left: 120px;
    }
}

.loading-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: white;
    width: 235px;
    height: 235px;
    position: absolute;
    top: 120px;
    animation: rotate 8s infinite linear, move-position 4s infinite ease-in-out;
}

.child-circle {
  position: absolute;
  width: 155px;
  height: 155px;
  background-color: white;
  border-radius: 50%;
}

.child-circle:nth-child(1) {
  transform: rotate(0deg) translate(68px) rotate(0deg);
}

.child-circle:nth-child(2) {
  transform: rotate(72deg) translate(70px) rotate(-72deg);
}

.child-circle:nth-child(3) {
  transform: rotate(144deg) translate(65px) rotate(-144deg);
}

.child-circle:nth-child(4) {
  transform: rotate(216deg) translate(75px) rotate(-216deg);
}

.child-circle:nth-child(5) {
  transform: rotate(288deg) translate(72px) rotate(-288deg);
}


/* =============== */
.record-close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
}

.record-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: 100% !important;
    background: black;
    height: 100vh;
    width: 100vw;
    z-index: 999;
}

.circle {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: white;
    position: absolute;
    top:120px;
    animation: breathe 2s infinite ease-in-out;
}

.controls {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  position: absolute;
  bottom: 30px;
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 5px;
}

.bar {
  width: 20px;
  background-color: white;
  margin: 0 0 10px 0;
  align-self: flex-end;
  border-radius: 10px;
}

@media only screen and (max-width: 1279px) {
  .record-close-btn {
    position: absolute;
    top: 50px !important;
    right: 30px;
  }
}

@media only screen and (max-width: 768px) {
  .record-close-btn {
    position: absolute;
    top: 10px !important;
    right:10px;
  }
}

.chatgpt-waveform {
    position: absolute;
    bottom: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 96vw;
    height: 100px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 20px;
    padding: 10px;
}

.chatgpt-waveform canvas {
    border-radius: 10px;
}
</style>