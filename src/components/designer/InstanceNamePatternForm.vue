<template>
    <div class="pa-2">
        <v-text-field label="Pattern" v-model="pattern"></v-text-field>
        <div v-html="explanation" class="px-2 pb-5"></div>
    </div>
</template>

<script>
export default {
    props:{
        pattern:{
            type: String,
            default: ''
        }
    },
    watch:{
        "pattern":{
            handler(newVal){
                this.$emit('update', newVal)
            }
        }
    },  
    computed:{
        explanation(){
            return `
                <h1> 패턴 작성법 </h1>
                JSP 태그을 이용한 패턴 사용으로 인스턴스명의 작성이 가능합니다.
                <br><br>
                <h3> 1. instance ID 이용한 패턴 작성.</h3>
                <span>
                <b> 예시: uEngine_<%=instance.instanceId%></b><br>
                결과: uEngine_13
                </span>
                <br><br>
                <h3> 2. 해당 Role의 Scope정보 설정 </h3>
                <span>
                <b> 예시: uEngine_<%=roles.사용자.endpoint%></b><br>
                결과: uEngine_manager
                </span>
                <br><br>
                <h3> 3. 프로세스명 으로 설정 </h3>
                <b> 예시: uEngine_<%=definition.id%></b><br>
                결과: uEngine_TroubleCenter
            `
        }
    },
}
</script>

