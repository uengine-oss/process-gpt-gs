import AIGenerator from "./AIGenerator";
import BackendFactory from "@/components/api/BackendFactory";
const backend = BackendFactory.createBackend();

export default class ProcessInstanceGenerator extends AIGenerator {

    constructor(client, language) {
        super(client, language);
        
        this.previousMessages = [];
        this.input = {
            answer: "",
            process_instance_id: "",
            process_definition_id: "",
            // userInfo: client.userInfo,
            image: null,
        };
    }

    beforeGenerate(obj, isNew) {
        if (obj) {
            if (obj.text)
                this.input.answer = obj.text;
            if (obj.image) 
                this.input.image = obj.image;
        }

        if (isNew) {
            if (this.client.processDefinition) {
                this.input.process_definition_id = this.client.processDefinition;
            };
            this.input.process_instance_id = "new";
        } else {
            var procInst = this.client.processInstance;
            this.input.activity_id = procInst.current_activity_ids[0];
            this.input.process_instance_id = procInst.proc_inst_id;
        }
    }

    async generate() {
        let data;
        const taskId = this.client.$route.params.taskId;
        if (taskId) {
            const input = {
                answer: this.input.answer,
                image: this.input.image
            }
            data = await backend.putWorkItemComplete(taskId, input);
        } else {
            data = await backend.start(this.input);
        }
        this.client.onGenerationFinished(data);
    }

}