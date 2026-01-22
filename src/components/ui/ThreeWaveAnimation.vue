<template>
    <div class="three-wave-container three-glow-container" ref="threeContainer">
    </div>
</template>

<script>
import * as THREE from 'three';
import { markRaw } from 'vue';

export default {
    name: 'ThreeWaveAnimation',
    props: {
        size: {
            type: Number,
            default: 250
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
    data() {
        return {
            scene: null,
            camera: null,
            renderer: null,
            uniforms: null,
            material: null,
            geometry: null,
            mesh: null,
            clock: null,
            animationId: null,
            isDestroyed: false,

        };
    },
    mounted() {
        this.initThreeJS();
        this.animate();
    },
    beforeUnmount() {
        this.cleanup();
    },
    watch: {
        // animate 메서드에서 모든 상태를 처리하므로 watch는 단순화
        // 필요시 추가적인 반응형 처리를 위해 유지
    },
    methods: {


        initThreeJS() {
            try {
                const container = this.$refs.threeContainer;
                
                // Renderer 설정 (Vue 반응형 시스템에서 제외)
                this.renderer = markRaw(new THREE.WebGLRenderer({ 
                    antialias: true,
                    alpha: true
                }));
                this.renderer.setClearColor(0x000000, 0);
                this.renderer.setSize(this.size, this.size);
                this.renderer.setPixelRatio(window.devicePixelRatio);
                container.appendChild(this.renderer.domElement);

                // Scene 설정 (Vue 반응형 시스템에서 제외)
                this.scene = markRaw(new THREE.Scene());

                // Camera 설정 (Vue 반응형 시스템에서 제외)
                this.camera = markRaw(new THREE.PerspectiveCamera(
                    45,
                    1, // 정사각형이므로 aspect ratio 1
                    0.1,
                    1000
                ));
                this.camera.position.set(0, 0, 8);

                // Clock 초기화 (Vue 반응형 시스템에서 제외)
                this.clock = markRaw(new THREE.Clock());

                // 색상 파싱 - CSS 변수에서 primary 색상 가져오기
                const primaryColorCSS = getComputedStyle(document.documentElement).getPropertyValue('--v-theme-primary').trim();
                const wireframeColor = new THREE.Color(primaryColorCSS || '#1976d2'); // fallback color

                // Uniforms 설정
                this.uniforms = {
                    u_time: { value: 0.0 },
                    u_frequency: { value: 0.0 },
                    u_red: { value: wireframeColor.r },
                    u_green: { value: wireframeColor.g },
                    u_blue: { value: wireframeColor.b }
                };

                // Vertex Shader (Perlin Noise 포함)
                const vertexShader = `
                    uniform float u_time;
                    uniform float u_frequency;
                    
                    // Perlin Noise functions
                    vec3 mod289(vec3 x) {
                        return x - floor(x * (1.0 / 289.0)) * 289.0;
                    }
                    
                    vec4 mod289(vec4 x) {
                        return x - floor(x * (1.0 / 289.0)) * 289.0;
                    }
                    
                    vec4 permute(vec4 x) {
                        return mod289(((x*34.0)+10.0)*x);
                    }
                    
                    vec4 taylorInvSqrt(vec4 r) {
                        return 1.79284291400159 - 0.85373472095314 * r;
                    }
                    
                    vec3 fade(vec3 t) {
                        return t*t*t*(t*(t*6.0-15.0)+10.0);
                    }
                    
                    float pnoise(vec3 P, vec3 rep) {
                        vec3 Pi0 = mod(floor(P), rep);
                        vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
                        Pi0 = mod289(Pi0);
                        Pi1 = mod289(Pi1);
                        vec3 Pf0 = fract(P);
                        vec3 Pf1 = Pf0 - vec3(1.0);
                        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
                        vec4 iy = vec4(Pi0.yy, Pi1.yy);
                        vec4 iz0 = Pi0.zzzz;
                        vec4 iz1 = Pi1.zzzz;
                        
                        vec4 ixy = permute(permute(ix) + iy);
                        vec4 ixy0 = permute(ixy + iz0);
                        vec4 ixy1 = permute(ixy + iz1);
                        
                        vec4 gx0 = ixy0 * (1.0 / 7.0);
                        vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
                        gx0 = fract(gx0);
                        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
                        vec4 sz0 = step(gz0, vec4(0.0));
                        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
                        gy0 -= sz0 * (step(0.0, gy0) - 0.5);
                        
                        vec4 gx1 = ixy1 * (1.0 / 7.0);
                        vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
                        gx1 = fract(gx1);
                        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
                        vec4 sz1 = step(gz1, vec4(0.0));
                        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
                        gy1 -= sz1 * (step(0.0, gy1) - 0.5);
                        
                        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
                        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
                        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
                        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
                        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
                        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
                        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
                        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
                        
                        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
                        g000 *= norm0.x;
                        g010 *= norm0.y;
                        g100 *= norm0.z;
                        g110 *= norm0.w;
                        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
                        g001 *= norm1.x;
                        g011 *= norm1.y;
                        g101 *= norm1.z;
                        g111 *= norm1.w;
                        
                        float n000 = dot(g000, Pf0);
                        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
                        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
                        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
                        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
                        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
                        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
                        float n111 = dot(g111, Pf1);
                        
                        vec3 fade_xyz = fade(Pf0);
                        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
                        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
                        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
                        return 2.2 * n_xyz;
                    }
                    
                    void main() {
                        float noise = 3.0 * pnoise(position + u_time, vec3(10.0));
                        float displacement = (u_frequency / 30.0) * (noise / 10.0);
                        vec3 newPosition = position + normal * displacement;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                    }
                `;

                // Fragment Shader - opacity 0.5 적용
                const fragmentShader = `
                    uniform float u_red;
                    uniform float u_green;
                    uniform float u_blue;
                    
                    void main() {
                        gl_FragColor = vec4(vec3(u_red, u_green, u_blue), 0.5);
                    }
                `;

                // 셰이더 Material 생성 (Vue 반응형 시스템에서 제외)
                this.material = markRaw(new THREE.ShaderMaterial({
                    wireframe: true,
                    transparent: true,
                    uniforms: this.uniforms,
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader
                }));

                // IcosahedronGeometry 사용 (Vue 반응형 시스템에서 제외)
                this.geometry = markRaw(new THREE.IcosahedronGeometry(2, 8));
                this.mesh = markRaw(new THREE.Mesh(this.geometry, this.material));
                this.scene.add(this.mesh);
                
            } catch (error) {
                console.error('Three.js 초기화 오류:', error);
            }
        },

        animate() {
            if (this.isDestroyed) return;
            
            this.animationId = requestAnimationFrame(this.animate);
            
            if (this.uniforms && this.clock) {
                // 시간 업데이트
                this.uniforms.u_time.value = this.clock.getElapsedTime();
                
                // PaintWaveAnimation과 동일한 로직 적용
                if (this.isActive) {
                    // 로딩 상태: 빠른 애니메이션
                    this.uniforms.u_frequency.value = 50 + Math.sin(this.uniforms.u_time.value * 4) * 20;
                } else if (this.isAudioPlaying && this.audioBars.length > 0) {
                    // 오디오 재생 상태: audioBars 데이터 사용 (PaintWaveAnimation과 동일한 계산)
                    const avgAudioLevel = this.audioBars.reduce((a, b) => a + b, 0) / this.audioBars.length;
                    this.uniforms.u_frequency.value = avgAudioLevel;
                } else if (this.volume > this.threshold) {
                    // 마이크 입력 상태: volume 데이터 사용
                    const volumeIntensity = (this.volume - this.threshold) / (100 - this.threshold);
                    this.uniforms.u_frequency.value = volumeIntensity * 50;
                } else {
                    // 기본 상태: 부드러운 기본 애니메이션
                    this.uniforms.u_frequency.value = Math.sin(this.uniforms.u_time.value) * 8 + 12;
                }
            }
            
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        },





        cleanup() {
            this.isDestroyed = true;
            
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            
            // Three.js 리소스 정리
            if (this.geometry) {
                this.geometry.dispose();
            }
            
            if (this.material) {
                this.material.dispose();
            }
            
            if (this.renderer) {
                this.renderer.dispose();
            }

        }
    }
};
</script>

<style scoped>
.three-wave-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.7) 0%, rgba(var(--v-theme-primary), 0.5) 20%, rgba(var(--v-theme-primary), 0.3) 40%, rgba(var(--v-theme-primary), 0.15) 60%, rgba(var(--v-theme-primary), 0.08) 80%, transparent 100%);
    position: relative;
}

.three-glow-container canvas {
    border-radius: 50%;
    position: relative;
    z-index: 2;
}
</style> 