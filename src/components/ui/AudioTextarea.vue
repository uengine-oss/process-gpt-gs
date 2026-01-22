<template>
    <div>
        <v-textarea v-if="useTextAudio" v-model="newMessage" hide-details density="compact" rows="3" no-resize placeholder="결과 입력">
            <template v-slot:append-inner>
                <div class="d-flex align-self-end cursor-pointer">
                    <!-- <div @click="onChangeRecordingDialog" class="mr-1">
                        <Icons :icon="'round-headset'"  />
                    </div> -->
                    <div @click="onClickMic" class="pb-4">
                        <Icons v-if="!isMicRecording && !isMicRecorderLoading" :icon="'sharp-mic'"  />
                        <Icons v-else-if="!isMicRecorderLoading" :icon="'stop'" :size="'20'"  />
                        <Icons v-else-if="isMicRecorderLoading" :icon="'bubble-loading'"  />
                    </div>
                </div>
            </template>
        </v-textarea>

        <Record @close="onChangeRecordingDialog" @start="startRecording" @stop="stopRecording"
            :audioResponse="newMessage" :chatRoomId="chatRoomId" :recordingMode="recordingDialog" />
    </div>
</template>

<script>
import Record from '@/components/ui/Record.vue';
import axios from 'axios';

export default {
    components: {
        Record
    },
    props: {
        modelValue: {
            type: String,
            default: ''
        },
        workItem: {
            type: Object,
            default: null
        },
        useTextAudio: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            newMessage: '',
            // recording chat
            recordingDialog: false,
            mediaRecorder: null,
            audioChunks: [],
            isRecording: false,
            chatRoomId: '',
            // voice recording
            isMicRecording: false,
            micRecorder: null,
            micAudioChunks: [],
            isMicRecorderLoading: false,
        }
    },
    watch: {
        modelValue(newVal) {
            this.newMessage = newVal;
        },
        newMessage(newVal) {
            this.$emit('update:modelValue', newVal);
        }
    },
    created() {
        this.newMessage = this.modelValue;
        if (this.workItem) {
            if(this.workItem.worklist && this.workItem.worklist.instId) {
                this.chatRoomId = this.workItem.worklist.instId;
            } else if (this.workItem.worklist && !this.workItem.worklist.instId) {
                const uuid = this.uuid();
                this.chatRoomId = `${this.workItem.worklist.defId}.${uuid}`;
            }
        }
    },
    methods: {
        uuid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },
        onChangeRecordingDialog() {
            this.recordingDialog = !this.recordingDialog;
            if (!this.recordingDialog) {
                this.$emit("close");
            }
        },
        async startRecording() {
            this.isRecording = true;

            if (!navigator.mediaDevices) {
                alert('getUserMedia를 지원하지 않는 브라우저입니다.');
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.mediaRecorder.ondataavailable = e => {
                this.audioChunks.push(e.data);
            };
            this.mediaRecorder.start();
        },
        stopRecording() {
            this.isRecording = false;
            // MediaRecorder의 상태가 'recording'인 경우에만 stop 메서드를 호출
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
                this.mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                    this.uploadAudio(audioBlob);
                };
            }
        },
        onClickMic() {
            if (this.isMicRecording) {
                this.stopVoiceRecording();
            } else {
                this.startVoiceRecording();
            }
        },
        async startVoiceRecording() {
            this.isMicRecording = true;

            if (!navigator.mediaDevices) {
                alert('getUserMedia를 지원하지 않는 브라우저입니다.');
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.micRecorder = new MediaRecorder(stream);
            this.micAudioChunks = [];
            this.micRecorder.ondataavailable = e => {
                this.micAudioChunks.push(e.data);
            };
            this.micRecorder.start();
        },
        stopVoiceRecording() {
            this.isMicRecording = false;
            // MediaRecorder의 상태가 'recording'인 경우에만 stop 메서드를 호출
            if (this.micRecorder && this.micRecorder.state === 'recording') {
                this.micRecorder.stop();
                this.micRecorder.onstop = async () => {
                const audioBlob = new Blob(this.micAudioChunks, { type: 'audio/wav' });
                await this.uploadAudio(audioBlob);
                };
            }
        },
        async uploadAudio(audioBlob) {
            this.isMicRecorderLoading = true; // 로딩 상태 시작

            const formData = new FormData();
            formData.append('audio', audioBlob);

            try {
                const response = await axios.post(`/completion/upload`, formData);
                const data = response.data;
                this.newMessage = data.transcript;
            } catch (error) {
                console.error('Error:', error);
            } finally {
                this.isMicRecorderLoading = false; // 로딩 상태 종료
            }
        },
    }
}
</script>