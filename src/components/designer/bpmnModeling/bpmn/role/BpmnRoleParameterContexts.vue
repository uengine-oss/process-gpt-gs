<template>
    <div div style="width: 100%">
        <!-- definition id 가 없어도 데이터가 있다면 최선을 다하여 출력하자 -->
        <!--<div v-if="calleeDefinitionId">-->
        <div v-for="(roleBinding, idx) in copyRoleBindings" :key="idx">
            <v-row class="ml-0 pa-0">
                <v-col cols="3">
                    <div>
                        <v-select label="Callee Roles" name="input" id="input" v-model="roleBinding.argument"
                            :items="calleeDefinitionRoles">
                            <!-- <v-option v-for="role in calleeDefinition.roles" :key="role.name" :value="role.name">
                                {{ role.name }}
                            </v-option> -->
                        </v-select>
                        <v-input v-model="roleBinding.argument"></v-input>
                    </div>
                </v-col>

                <v-col cols="3">
                    <div>
                        <v-select v-model="roleBinding.direction" style="min-width: 20px;" :items="connectDirections"
                            item-props :label="$t('BpmnParameterContexts.direction')">
                            <template v-slot:selection="{ item }">
                                <v-icon>{{ iconForDirection(item.value) }}</v-icon>
                            </template>
                            <template v-slot:item="{ item }">
                                <v-list-item @click="roleBinding.direction = item.value">
                                    <v-icon>{{ iconForDirection(item.value) }}</v-icon>
                                </v-list-item>
                            </template>
                        </v-select>
                    </div>
                </v-col>
                <v-col cols="3">
                    <div>
                        <v-text-field v-if="isSub" v-model="roleBinding.role.name"></v-text-field>
                        <v-select v-else label="Caller Roles" v-model="roleBinding.role.name" :items="definitionRoles"
                            item-title="name" item-value="name">
                            <!-- <md-option v-for="role in definition.roles" :key="role.name" :value="role.name">
                                {{ role.name }}
                            </md-option> -->
                        </v-select>
                    </div>
                </v-col>
                <v-col>
                    <v-checkbox v-model="roleBinding.split">Split</v-checkbox>
                </v-col>

                <v-col>
                    <v-btn icon flat v-on:click="remove(roleBinding)">
                        <TrashIcon stroke-width="1.5" size="20" class="text-error" />
                    </v-btn>
                </v-col>
            </v-row>
        </div>

        <v-btn text color="primary" variant="flat" rounded style="margin: 0 0 20px 8px;" v-on:click="add">
            <v-row class="pa-0 ma-0 align-center">
                <v-icon class="mr-2" style="padding-top: 3px;">mdi-plus</v-icon>
                <div>{{ $t('BpmnRoleParameterContexts.addMapping') }}</div>
            </v-row>
        </v-btn>
    </div>
    <!--</div>-->
</template>

<script>

export default {
    name: "bpmn-role-parameter-contexts",
    props: {
        isSub: {
            type: Boolean,
            default: false
        },
        roleBindings: Array,
        definitionRoles: Array,
        calleeDefinitionRoles: Array,
        isViewMode: Boolean
        // calleeDefinitionId: String
    },
    data: function () {
        return {
            copyRoleBindings: this.roleBindings ? this.roleBindings : [],
            connectDirections: ['IN-OUT', 'IN', 'OUT']
        };
    },
    watch: {
        // copyRoleBindings: {
        //     handler: function (after, before) {
        //         this.$emit('update:roleBindings', after);
        //     },
        //     deep: true
        // },
    },
    created: function () {
    },
    methods: {
        iconForDirection: function (direction) {
            if (direction == "IN")
                return "mdi-arrow-left";
            else if (direction == "OUT" || direction == "OUT ")
                return "mdi-arrow-right";
            else
                return "mdi-arrow-left-right";
        },
        add: function () {
            this.copyRoleBindings.push({
                direction: 'IN-OUT',
                role: {
                    name: ''
                },
                argument: ''  //TODO: object path differ from ParameterContext
            })
        },
        remove: function (parameterContext) {
            //TODO: find and remove
            this.copyRoleBindings.splice(this.copyRoleBindings.indexOf(parameterContext), 1);
        }
    }
}

</script>
