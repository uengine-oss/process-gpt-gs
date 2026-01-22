<template>
    <div class="w-100">
        <v-row class="w-100">
            <v-col cols="5">
                <AgentSkills @update:skillFile="selectedSkillFile" />
            </v-col>
            <v-col cols="7" class="px-0">
                <AgentSkillEdit v-if="skillFile" :skillFile="skillFile" />
            </v-col>
        </v-row>
    </div>
</template>

<script>
import AgentSkills from '@/components/AgentSkills.vue';
import AgentSkillEdit from '@/components/AgentSkillEdit.vue';
export default {
    components: {
        AgentSkills,
        AgentSkillEdit
    },
    data() {
        return {
            skillFile: null
        }
    },
    watch: {
    },
    methods: {
        selectedSkillFile(skillFile) {
            this.skillFile = skillFile;
        }
    }
}
</script>