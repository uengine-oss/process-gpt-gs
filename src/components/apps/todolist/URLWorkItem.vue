<template>
    <div style="height: calc(100vh - 239px); padding: 20px" >
        <URLForm :url="url"></URLForm>
    </div>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
import URLForm from '@/components/designer/URLForm.vue';

export default  {
    props: {
        workItem: {
            type: Object,
            default: function () {
                return null;
            }
        },
        workItemStatus: {
            type: String,
            default: function () {
                return null
            }
        },
        isDryRun: Boolean,
        dryRunWorkItem: {
            type: Object,
            default: function () {
                return {}
            }
        },
        currentActivities: {
            type: Array,
            default: function () {
                return []
            }
        },
    },
    components: {
        URLForm
    },
    computed:{
        url(){
            var me = this
            if(me.isDryRun){
                return me.dryRunWorkItem.activity.tool.replace('urlHandler:','')
            } else {
                return me.workItem.worklist.tool.replace('urlHandler:','')
            }
        },
        origin(){
            if(!this.url) return null;
            return new URL(this.url).origin;
        }
    },
    mounted(){
        var me = this
        const backend = BackendFactory.createBackend();
        window.addEventListener('message', async function(event) {
            if(!origin) return;
            
            if(event.origin === me.origin){
                let dataObj = event.data;
                let eventSynchronization = null
                if(me.isDryRun){
                    eventSynchronization = me.dryRunWorkItem.activity.eventSynchronization
                } else {
                    eventSynchronization = me.workItem.activity.eventSynchronization
                }
                if(!eventSynchronization) return;

                if(eventSynchronization.eventType == dataObj.eventType){
                    let workItem = await backend.getCurrentWorkItemByCorrKey(dataObj.id)
                    if(workItem){
                        let val = me.currentActivities.concat(workItem.activity.tracingTag)
                        me.$emit("updateCurrentActivities", val)
                    }
                }  
            }
            return;
        });
    },
    methods:{
        close(){
            this.$emit('close')
        },
    },
}
</script>
