<template>
    <section id="tutorial" class="tutorial-section">
        <div class="container">
            <div class="tutorial-header">
                <button @click="closeTutorial" class="close-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            <div class="section-title">
                <h2>Process GPT 튜토리얼</h2>
                <p>Process GPT 사용법을 단계별로 배워보세요</p>
            </div>
            
            <div class="tutorial-grid">
                <div class="tutorial-card" v-for="(step, index) in tutorialSteps" :key="index">
                    <div class="tutorial-number">{{ index + 1 }}</div>
                    <div class="tutorial-content">
                        <h3>{{ step.title }}</h3>
                        <p>{{ step.description }}</p>
                        <div class="tutorial-demo">
                            <img :src="step.image" :alt="step.title" />
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="tutorial-actions">
                <button @click="startTutorial" class="btn-primary">튜토리얼 시작하기</button>
                <button @click="goToDemo" class="btn-secondary">데모 보기</button>
            </div>
        </div>
    </section>
</template>

<script>
export default {
    name: 'TutorialSection',
    data() {
        return {
            tutorialSteps: [
                {
                    title: '프로세스 정의 생성',
                    description: 'AI와 대화를 통해 비즈니스 프로세스를 정의해보세요.',
                    image: '@/assets/images/detailImage/demo1.png'
                },
                {
                    title: '프로세스 맵 시각화',
                    description: '생성된 프로세스를 BPMN 다이어그램으로 확인할 수 있습니다.',
                    image: '@/assets/images/detailImage/demo2.png'
                },
                {
                    title: '워크플로우 실행',
                    description: '정의된 프로세스를 실제로 실행하고 관리해보세요.',
                    image: '@/assets/images/detailImage/demo3.png'
                }
            ]
        }
    },
    methods: {
        startTutorial() {
            console.log('튜토리얼을 시작합니다');
            // 튜토리얼 시작 로직 구현
            this.$router.push('/definitions');
        },
        goToDemo() {
            console.log('데모 페이지로 이동합니다');
            // 데모 페이지로 이동 로직
            window.open('https://bpm-intro.uengine.io/process-gpt/', '_blank');
        },
        closeTutorial() {
            console.log('튜토리얼을 닫습니다');
            this.$emit('close-tutorial');
        }
    }
}
</script>

<style scoped>
.tutorial-section {
    padding: 100px 0;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
    position: relative;
}

.tutorial-header {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 10;
}

.close-btn {
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.close-btn:hover {
    background: white;
    transform: scale(1.1);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.close-btn svg {
    color: #2c3e50;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.section-title {
    text-align: center;
    margin-bottom: 60px;
}

.section-title h2 {
    font-size: 3rem;
    color: #2c3e50;
    margin-bottom: 20px;
    font-weight: 700;
}

.section-title p {
    font-size: 1.3rem;
    color: #7f8c8d;
    max-width: 600px;
    margin: 0 auto;
}

.tutorial-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 40px;
    margin-bottom: 60px;
}

.tutorial-card {
    background: white;
    border-radius: 16px;
    padding: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    position: relative;
    overflow: hidden;
}

.tutorial-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.tutorial-number {
    position: absolute;
    top: -20px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.tutorial-content h3 {
    font-size: 1.5rem;
    color: #2c3e50;
    margin-bottom: 15px;
    margin-top: 20px;
}

.tutorial-content p {
    font-size: 1rem;
    color: #6c757d;
    line-height: 1.6;
    margin-bottom: 20px;
}

.tutorial-demo {
    text-align: center;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    margin-top: 20px;
}

.tutorial-demo img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.tutorial-actions {
    text-align: center;
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
    padding: 15px 30px;
    border: none;
    border-radius: 50px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 200px;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
}

.btn-secondary:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(245, 87, 108, 0.4);
}

@media (max-width: 768px) {
    .tutorial-section {
        padding: 60px 0;
    }
    
    .section-title h2 {
        font-size: 2.2rem;
    }
    
    .tutorial-grid {
        grid-template-columns: 1fr;
        gap: 30px;
        margin-bottom: 40px;
    }
    
    .tutorial-card {
        padding: 20px;
    }
    
    .tutorial-actions {
        flex-direction: column;
        align-items: center;
    }
    
    .btn-primary,
    .btn-secondary {
        width: 100%;
        max-width: 300px;
    }
}

@media (max-width: 480px) {
    .tutorial-grid {
        grid-template-columns: 1fr;
    }
    
    .tutorial-card {
        margin: 0 10px;
    }
}
</style>
