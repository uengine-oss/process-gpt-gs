<template>
    <div class="container">
        <canvas ref="canvas"></canvas>
        <button title="Record" @click="toggleRecording">
            <Icons class="record" :icon="isRecording ? 'stop' : 'armrecording'" />
        </button>
        <audio ref="audio" controls></audio>
    </div>
</template>

<script>
import gsap from 'gsap';
import { Icon } from '@iconify/vue';

export default {
    components: {
        Icon
    },
    data() {
        return {
            audioContext: null,
            analyser: null,
            microphone: null,
            dataArray: null,
            volume: 0, // 데시벨 수치
            threshold: 10, // 임계값 설정
            isRecording: false, // 녹음 상태
            stream: null, // 마이크 스트림
            bars: [],
            REPORT: null,
            recorder: null,
            CONFIG: {
                fps: 60,
                duration: 0.1,
                fft: 64, // fft size를 증가시켜 더 많은 데이터를 수집
                fftPlaceholder: 4,
                show: false
            }
        };
    },
    methods: {
        async getMicrophoneInput() {
            if (!navigator.mediaDevices) {
                alert("브라우저가 마이크 입력을 지원하지 않습니다.");
                return;
            }
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new AudioContext();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(this.stream);
            this.microphone.connect(this.analyser);
            this.analyser.fftSize = this.CONFIG.fft;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.updateVolume();
        },
        updateVolume() {
            if (!this.isRecording) return;
            this.analyser.getByteFrequencyData(this.dataArray);
            let sum = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                sum += this.dataArray[i];
            }
            this.volume = sum / this.dataArray.length;
            if (this.volume > this.threshold) {
                this.updateBars();
            } else {
                this.resetBars();
            }
            this.drawBars();
            requestAnimationFrame(this.updateVolume);
        },
        toggleRecording() {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        },
        async startRecording() {
            this.isRecording = true;
            await this.getMicrophoneInput();
            const CHUNKS = [];
            this.recorder = new MediaRecorder(this.stream);
            this.recorder.ondataavailable = event => {
                CHUNKS.push(event.data);
                if (this.recorder && this.recorder.state === 'inactive') {
                    const AUDIO_BLOB = new Blob(CHUNKS, { type: "audio/mp3" });
                    this.$refs.audio.src = window.URL.createObjectURL(AUDIO_BLOB);
                    this.$refs.audio.style.display = 'block';
                }
            };
            this.recorder.start();
            this.analyseStream(this.stream);
        },
        stopRecording() {
            this.isRecording = false;
            if (this.recorder) {
                this.recorder.stop();
                this.recorder = null;
            }
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            if (this.audioContext) {
                this.audioContext.close();
                this.audioContext = null;
            }
            this.resetBars();
        },
        analyseStream(stream) {
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);
            this.genBars(4);

            this.REPORT = () => {
                if (this.isRecording) {
                    this.analyser.getByteFrequencyData(this.dataArray);
                    if (this.volume > this.threshold) {
                        gsap.to(this.bars, {
                            duration: this.CONFIG.duration,
                            height: index => {
                                return 10 + gsap.utils.mapRange(0, 255, 0, 150)(this.dataArray[index]);
                            }
                        });
                    }
                    this.drawBars();
                }
            };
            gsap.ticker.add(this.REPORT);
        },
        genBars(size) {
            const canvasWidth = 300;
            const spacing = canvasWidth / (size + 1);
            this.bars = new Array(size).fill().map((_, i) => ({
                x: (i + 1) * spacing,
                y: canvasWidth,
                width: 40, // 바의 너비를 증가시켜 더 잘 보이도록 설정
                height: 10,
                hue: 0 // 흰색
            }));
        },
        updateBars() {
            gsap.to(this.bars, {
                duration: this.CONFIG.duration,
                height: index => {
                    const newHeight = this.dataArray[index] / 255;
                    return 10 + gsap.utils.mapRange(0, 1, 0, 250)(newHeight); // 바의 높이 범위를 증가시켜 더 잘 보이도록 설정
                }
            });
        },
        resetBars() {
            gsap.to(this.bars, {
                duration: this.CONFIG.duration,
                height: 10
            });
        },
        drawBar({ x, y, width, height, hue }) {
            const ctx = this.$refs.canvas.getContext('2d');
            const radius = 10; // 바의 라운드 반지름
            const BAR_POINT_X = x - width / 2;
            const BAR_POINT_Y = y - height;
            
            // 둥근 사각형 그리기
            ctx.beginPath();
            ctx.moveTo(BAR_POINT_X + radius, BAR_POINT_Y);
            ctx.lineTo(BAR_POINT_X + width - radius, BAR_POINT_Y);
            ctx.quadraticCurveTo(BAR_POINT_X + width, BAR_POINT_Y, BAR_POINT_X + width, BAR_POINT_Y + radius);
            ctx.lineTo(BAR_POINT_X + width, BAR_POINT_Y + height - radius);
            ctx.quadraticCurveTo(BAR_POINT_X + width, BAR_POINT_Y + height, BAR_POINT_X + width - radius, BAR_POINT_Y + height);
            ctx.lineTo(BAR_POINT_X + radius, BAR_POINT_Y + height);
            ctx.quadraticCurveTo(BAR_POINT_X, BAR_POINT_Y + height, BAR_POINT_X, BAR_POINT_Y + height - radius);
            ctx.lineTo(BAR_POINT_X, BAR_POINT_Y + radius);
            ctx.quadraticCurveTo(BAR_POINT_X, BAR_POINT_Y, BAR_POINT_X + radius, BAR_POINT_Y);
            ctx.closePath();
            ctx.fillStyle = `hsl(${hue}, 0%, 100%)`;
            ctx.fill();
        },
        drawBars() {
            const ctx = this.$refs.canvas.getContext('2d');
            ctx.clearRect(0, 0, 300, 300);
            for (const bar of this.bars) {
                this.drawBar(bar);
            }
        }
    },
    mounted() {
        this.genBars(4);
        this.drawBars();
    }
};
</script>

<style scoped>
* {
    box-sizing: border-box;
}

body {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 1rem;
    background: hsl(0, 0%, 20%);
}

audio {
    display: block;
}

canvas {
    height: 400px; /* 캔버스의 높이 증가 */
    width: 400px; /* 캔버스의 너비 증가 */
    background: hsl(0, 0%, 10%);
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.record {
    border-radius: 50%;
    border: 4px solid white;
    font-size: 0;
    height: 48px;
    width: 48px;
    background: none;
    position: relative;
    overflow: hidden;
    display: flex; /* 버튼 내용물을 가운데로 배치하기 위해 추가 */
    align-items: center; /* 버튼 내용물을 가운데로 배치하기 위해 추가 */
    justify-content: center; /* 버튼 내용물을 가운데로 배치하기 위해 추가 */
}

.record:after {
    content: '';
    position: absolute;
    background: hsl(10, 80%, 50%);
    height: 100%;
    width: 100%;
    top: 50%;
    left: 50%;
    cursor: pointer;
    transform: translate(-50%, -50%) scale(calc(1 - (var(--active, 0) * 0.5)));
    border-radius: 15%;
    transition: transform 0.1s;
}

.reveal {
    cursor: pointer;
    position: fixed;
    top: 1rem;
    right: 1rem;
    height: 48px;
    width: 48px;
    display: grid;
    place-items: center;
    padding: 0;
    background: none;
    border: none;
}

.reveal svg {
    width: 100%;
    fill: hsl(0, 0%, 6%);
}

.reveal[aria-pressed="true"] svg:nth-of-type(1),
.reveal svg:nth-of-type(2) {
    display: none;
}

.reveal[aria-pressed="true"] svg:nth-of-type(2) {
    display: block;
}
</style>
