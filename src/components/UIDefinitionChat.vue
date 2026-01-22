<template>
    <v-card elevation="10">
        <AppBaseCard>
            <template v-slot:leftpart>
                <div class="no-scrollbar">
                    <Chat
                        :chatInfo="chatInfo"
                        :messages="messages"
                        :userInfo="userInfo"
                        type="form"
                        @sendMessage="beforeSendMessage"
                        @sendEditedMessage="sendEditedMessage"
                        @stopMessage="stopMessage"
                    >
                        <template v-slot:custom-tools>
                            <div class="d-flex flex-row-reverse" style="height: 0px; position: relative; bottom: 35px; left: 10px">
                                <v-tooltip>
                                    <template v-slot:activator="{ props }">
                                        <v-btn v-bind="props"
                                            icon variant="text"
                                            class="text-medium-emphasis"
                                            @click="openSaveDialog"
                                        >
                                            <Icons :icon="'save'"
                                                :class="{
                                                    'icon-heartbit': isChanged
                                                }"
                                            />
                                        </v-btn>
                                    </template>
                                    <span>{{ $t('uiDefinition.save') }}</span>
                                </v-tooltip>

                                <v-tooltip>
                                    <template v-slot:activator="{ props }">
                                        <v-btn v-if="isLoadedForm" 
                                            v-bind="props" 
                                            icon  variant="text" 
                                            class="text-medium-emphasis"
                                            @click="openDeleteDialog">
                                            <TrashIcon size="24" />
                                        </v-btn>
                                    </template>
                                    <span>{{ $t('uiDefinition.deleteForm') }}</span>
                                </v-tooltip>
                            </div>
                        </template>
                    </Chat>
                </div>
            </template>
            <template v-slot:rightpart>
                <v-tabs v-model="currentTabName" style="position: fixed; z-index: 999" color="primary" fixed-tabs>
                    <v-tab value="edit">{{ $t('uiDefinition.redaction') }}</v-tab>
                    <v-tab value="preview">{{ $t('uiDefinition.preview') }}</v-tab>
                </v-tabs>
                <v-window v-model="currentTabName" class="fill-height">
                    <v-window-item value="edit" class="fill-height mt-12" style="overflow-y: auto;">
                        <mashup
                            v-if="isShowMashup"
                            ref="mashup"
                            v-model="kEditorInput"
                            :key="mashupKey"
                            @onSaveFormDefinition="saveFormDefinition"
                            @onInitKEditorContent="updateKEditorContentBeforeSave"
                        />
                        <div v-else class="d-flex align-center justify-center fill-height">
                            <v-progress-circular color="primary" indeterminate></v-progress-circular>
                        </div>
                    </v-window-item>

                    <v-window-item value="preview" class="fill-height mt-10 pa-5" style="overflow-y: auto">
                        <template v-if="isShowPreview">
                            <DynamicForm ref="dynamicForm" :readonly="isReadOnlyForm" :formHTML="previewHTML" v-model="previewFormValues"></DynamicForm>

                            <template v-if="dev.isDevMode">
                                <!-- readonly 체크 변경 -->
                                <v-checkbox v-model="isReadOnlyForm" label="readonly 체크"></v-checkbox>
                                <v-textarea label="previewFormValuesToTest" rows="10" v-model="dev.previewFormValues"></v-textarea>
                                <v-btn color="primary" class="full-width my-5" @click="onClickPreviewApplyButton">적용</v-btn>
                            </template>

                            <v-row class="ma-0 pa-0">
                                <v-spacer></v-spacer>
                                <v-btn color="primary" @click="onClickPreviewSubmitButton" rounded>제출</v-btn>
                            </v-row>
                        </template>
                        <div v-else class="d-flex align-center justify-center fill-height">
                            <v-progress-circular color="primary" indeterminate></v-progress-circular>
                        </div>
                    </v-window-item>
                </v-window>
            </template>

            <template v-slot:mobileLeftContent>
                <Chat
                    :chatInfo="chatInfo"
                    :messages="messages"
                    :userInfo="userInfo"
                    type="form"
                    @sendMessage="beforeSendMessage"
                    @sendEditedMessage="sendEditedMessage"
                    @stopMessage="stopMessage"
                >
                    <template v-slot:custom-tools>
                        <div class="d-flex flex-row-reverse" style="height: 0px; position: relative; bottom: 35px; left: 10px">
                            <v-tooltip>
                                <template v-slot:activator="{ props }">
                                    <v-btn v-bind="props"
                                        icon variant="text"
                                        class="text-medium-emphasis"
                                        @click="openSaveDialog"
                                    >
                                        <Icons :icon="'save'" />
                                    </v-btn>
                                </template>
                                <span>{{ $t('uiDefinition.save') }}</span>
                            </v-tooltip>

                            <v-tooltip location="bottom">
                                <template v-slot:activator="{ props }">
                                    <v-btn v-if="isLoadedForm" 
                                        v-bind="props" 
                                        icon  variant="text" 
                                        class="text-medium-emphasis"
                                        @click="openDeleteDialog">
                                        <TrashIcon size="24" />
                                    </v-btn>
                                </template>
                                <span>{{ $t('uiDefinition.deleteForm') }}</span>
                            </v-tooltip>
                        </div>
                    </template>
                </Chat>
            </template>
        </AppBaseCard>
    </v-card>

    <v-dialog v-model="isOpenSaveDialog">
        <form-design-save-panel @onClose="isOpenSaveDialog = false" @onSave="tryToSaveFormDefinition" :savedId="(loadFormId === 'chat') ? null : loadFormId"
            :formNameByUrl="formNameByUrl">
        </form-design-save-panel>
    </v-dialog>

    <v-dialog v-model="isOpenDeleteDialog" max-width="500">
        <v-card class="pa-0">
            <v-row class="ma-0 pa-4 pb-0 align-center">
                <v-card-title class="pa-0">
                    {{ $t('uiDefinition.deleteFormMessage') }}
                </v-card-title>
                <v-spacer></v-spacer>
                <v-btn @click="isOpenDeleteDialog = false"
                    class="ml-auto" 
                    variant="text" 
                    density="compact"
                    icon
                >
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-row>
            <v-row class="ma-0 pa-4">
                <v-spacer></v-spacer>
                <v-btn @click="deleteForm"
                    color="error"
                    rounded 
                    variant="flat" 
                >
                    {{ $t('uiDefinition.delete') }}
                </v-btn>
            </v-row>
        </v-card>
    </v-dialog>
</template>

<script>
import * as jsondiff from 'jsondiffpatch';
import ChatDetail from '@/components/apps/chats/ChatDetail.vue';
import ChatListing from '@/components/apps/chats/ChatListing.vue';
import ChatProfile from '@/components/apps/chats/ChatProfile.vue';
import Mashup from '@/components/designer/Mashup.vue';
import AppBaseCard from '@/components/shared/AppBaseCard.vue';
import FormDesignSavePanel from '@/components/designer/FormDesignSavePanel.vue';
import ChatModule from './ChatModule.vue';
import ChatGenerator from './ai/FormDesignGenerator';
import Chat from './ui/Chat.vue';
import DynamicForm from '@/components/designer/DynamicForm.vue';
import FormDefinitionTestTerminal from './testTerminals/FormDefinitionTestTerminal.vue';

var jsondiffpatch = jsondiff.create({
    objectHash: function (obj, index) {
        return '$$index:' + index;
    }
});

export default {
    mixins: [
        ChatModule,
        FormDefinitionTestTerminal
    ],
    name: 'UIDefinitionChat',
    components: {
        Chat,
        AppBaseCard,
        ChatListing,
        ChatDetail,
        ChatProfile,
        Mashup,
        ChatGenerator,
        FormDesignSavePanel,
        DynamicForm
    },
    data: () => ({
        path: 'form_def',
        chatInfo: {
            title: 'uiDefinition.cardTitle',
            text: 'uiDefinition.uiDefinitionExplanation'
        },

        kEditorInput: ``, // Mashup 컴포넌트의 KEditor을 업데이트하기 위해서 전달되는 값
        mashupKey: 0, // kEditorInput가 변경되었을 경우, Mashup 컴포넌트를 다시 렌더링하기 위해서

        prevFormOutput: '', // 폼 디자이너에게 이미 이전에 생성된 HTML 결과물을 전달하기 위해서
        prevMessageFormat: '', // 사용자가 KEditor를 변경할때마다 해당 포맷을 기반으로 System 메시지를 재구축해서 보내기 위해서

        storedFormDefHTML: "",
        isOpenSaveDialog: false,
        currentTabName: '',
        isShowMashup: false,

        previewHTML: '',
        previewFormValues: {},
        isShowPreview: false,
        isReadOnlyForm: false,

        dev: {
            isDevMode: window.localStorage.getItem('isDevMode') === 'true',
            previewFormValues: ''
        },
        loadFormId: '',
        isLoadedForm: false,

        kEditorContentBeforeSave: "",
        isAIUpdated: false,
        isRoutedWithUnsaved: false,

        processDefUrlData: null,
        formNameByUrl: null,

        isOpenDeleteDialog: false,
        isDefaultFormMode: false,

        isChanged: false
    }),
    async created() {
        const reloadOnConnectionFailure = async () => {
            if(!(await this.backend.checkDBConnection())) {
                const reloadOnConnectionSuccess = async () => {
                    if(await this.backend.checkDBConnection())
                        this.$router.go(0);
                    else
                        setTimeout(reloadOnConnectionSuccess, 500);
                }
                setTimeout(reloadOnConnectionSuccess, 500);
            }
        }
        if (this.backend) {
            reloadOnConnectionFailure()
        }

        this.generator = new ChatGenerator(this, {
            isStream: true,
            preferredLanguage: 'Korean'
        });
        await this.init();

        // #region 프로세스 정의에서 폼 생성 요청으로 새 탭을 열었을 경우, 이를 적절하게 처리
        const urlParams = new URLSearchParams(window.location.search);
        const processDefUrlData = urlParams.get('process_def_url_data');
        if(processDefUrlData) {
            this.processDefUrlData = JSON.parse(decodeURIComponent(atob(processDefUrlData)));
            this.beforeSendMessage({
                "image": null,
                "text": this.processDefUrlData.initPrompt,
                "mentionedUsers": []
            });

            this.formNameByUrl = this.processDefUrlData.formName;
        }

        if(window.location.pathname.includes('/ui-definitions/defaultform')) {
            this.isDefaultFormMode = true;
        }
        // #endregion
    },
    watch: {
        /**
         * URL에서 폼을 가리키는 ID가 변경되었을 경우, 재업데이트를 위해서
         */
        $route: {
            deep: true,
            handler(newVal, oldVal) {
                if (!newVal.path.startsWith('/ui-definitions')) return;

                if(this.isRoutedWithUnsaved) {
                    this.isRoutedWithUnsaved = false;
                    return;
                }

                if (newVal.path !== oldVal.path) {
                    if(this.$refs.mashup) {
                        if(this.isAIUpdated || (this.$refs.mashup.getKEditorContentHtml() != this.kEditorContentBeforeSave)) {
                            const answer = window.confirm(this.$t('changePath'));
                            if (answer)
                                this.loadData();
                            else {
                                this.isRoutedWithUnsaved = true;
                                this.$router.push(oldVal.path);
                            }
                        }
                        else
                            this.loadData();
                    }
                    else
                        this.loadData();
                }
                else this.isShowMashup = true;
            }
        },

        currentTabName: {
            handler() {
                if (this.currentTabName === 'edit') $("div[id^='keditor-content-area-']").css('display', 'block');
                // 미리보기에 KEditor에서 편집한 HTML을 로드시키기 위해서
                else {
                    $("div[id^='keditor-content-area-']").css('display', 'none');
                    this.applyToPreviewTab();
                }
            }
        }
    },
    methods: {
        updateKEditorContentBeforeSave(kEditorContent) {
            this.kEditorContentBeforeSave = kEditorContent;
        },

        openSaveDialog() {
            if(this.isDefaultFormMode) {
                this.tryToSaveFormDefinition({ id: 'defaultform' });
            } else {
                this.isOpenSaveDialog = true;
            }

        },

        openDeleteDialog() {
            this.isOpenDeleteDialog = true;
        },

        /**
         * ID 정보를 제공하고, 'Save' 버튼을 누를 경우, 최종 결과를 DB에 저장시키기 위해서
         */
        async tryToSaveFormDefinition({ id }) {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    const kEditorContentHTML = me.$refs.mashup.getKEditorContentHtml();
                    const DynamicFormHTML = me.keditorContentHTMLToDynamicFormHTML(kEditorContentHTML);

                    await me.saveFormDefinition({
                        id: id,
                        html: DynamicFormHTML
                    });
                    me.isChanged = false;
                },
                successMsg: this.$t('successMsg.save')
            });
        },

        /**
         * KEditor에서 추출한 내용을 실제로 DynamicForm 컴포넌트에 적용할 수 있는 형태로 변환시키기 위해서
         */
        keditorContentHTMLToDynamicFormHTML(html) {
            const dom = new DOMParser().parseFromString(html, 'text/html');


            // 이름 중복 여부를 검사하기 위해서
            const nameSet = new Set();
            (dom.querySelectorAll('[name]')).forEach((el) => {
                const name = el.getAttribute('name');
                if(!name || name.length <= 0) return;

                if (nameSet.has(name)) {
                    throw new Error(`'${name}' 이름이 중복되어 있습니다.`);
                }
                nameSet.add(name);
            });


            const rows = dom.querySelectorAll('div.row');

            // rows의 is_multidata_mode가 true인 경우, 그 안에는 code-field가 존재하면 안되며, 그럴경우, 예외 발생
            for(let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const isMultiDataMode = row.getAttribute('is_multidata_mode');
                if (isMultiDataMode === "true") {
                    const codeField = row.querySelector('code-field');
                    if(codeField) throw new Error(`multidataMode가 설정된 레이아웃 안에 code-field가 존재할 수 없습니다.`);
                }
            }
            

            rows.forEach(row => {
                const isMultiDataMode = row.getAttribute('is_multidata_mode');
                if (!isMultiDataMode || (isMultiDataMode === 'false')) {
                    // row의 부모 노드를 계속 탐색해서. 그 노드가 is_multidata_mode="true"의 속성을 가졌는지 확인함
                    let isPerentNodeMultiDataMode = false;
                    let parentNode = row.parentNode;
                    while(parentNode && parentNode.tagName.toLowerCase() !== 'body') {
                        if(parentNode.getAttribute('is_multidata_mode') === "true") {
                            isPerentNodeMultiDataMode = true;
                            break;
                        }
                        parentNode = parentNode.parentNode;
                    }
                    

                    const newRow = document.createElement('row-layout');
                    

                    newRow.setAttribute('name', row.getAttribute('name') ?? "");
                    newRow.setAttribute('alias', row.getAttribute('alias') ?? "");
                    newRow.setAttribute('is_multidata_mode', row.getAttribute('is_multidata_mode') ?? "false");

                    newRow.setAttribute('v-model', (isPerentNodeMultiDataMode) ? 'item' : 'formValues');
                    newRow.setAttribute('v-slot', 'slotProps');


                    const innerRow = document.createElement('div');
                    innerRow.setAttribute('class', 'row');

                    Array.from(row.children).forEach(child => {
                        innerRow.appendChild(child);
                    });


                    $(innerRow).children('[class^="col-sm-"]').children('[name]').each(function () {
                        var field = ($(this))[0];
                        
                        if(field.tagName.toLowerCase() === "code-field") {
                            const name = field.getAttribute('name');
                            field.setAttribute('v-model', `codeInfos['${name}']`);

                            const event_type = field.getAttribute('event_type');
                            if(event_type === "click") {
                                field.setAttribute('v-on:on_click', `executeCode('${name}')`);
                            }
                        } else {
                            const name = field.getAttribute('name');
                            field.setAttribute('v-model', `slotProps.modelValue['${name}']`);
                        }
                    });


                    newRow.appendChild(innerRow);

                    row.parentNode.replaceChild(newRow, row);
                } else {
                    if((!row.getAttribute('name')) || (row.getAttribute('name').length <= 0)) {
                        throw new Error(`multidataMode가 설정된 레이아웃에 'name' 속성이 없습니다.`);
                    }

                    // row의 부모 노드를 계속 탐색해서. 그 노드가 is_multidata_mode="true"의 속성을 가졌는지 확인함
                    let isPerentNodeMultiDataMode = false;
                    let parentNode = row.parentNode;
                    while(parentNode && parentNode.tagName.toLowerCase() !== 'body') {
                        if(parentNode.getAttribute('is_multidata_mode') === "true") {
                            isPerentNodeMultiDataMode = true;
                            break;
                        }
                        parentNode = parentNode.parentNode;
                    }


                    const newRow = document.createElement('row-layout');

                    newRow.setAttribute('name', row.getAttribute('name'));
                    newRow.setAttribute('alias', row.getAttribute('alias') ?? "");
                    newRow.setAttribute('is_multidata_mode', row.getAttribute('is_multidata_mode'));

                    newRow.setAttribute('v-model', (isPerentNodeMultiDataMode) ? 'item' : 'formValues');
                    newRow.setAttribute('v-slot', 'slotProps');


                    const containerDiv = document.createElement('div');
                    containerDiv.setAttribute('v-for', '(item, index) in slotProps.modelValue');
                    containerDiv.setAttribute(':key', 'index');

                    const head = document.createElement('row-layout-item-head');
                    head.setAttribute(':index', 'index');
                    head.setAttribute('v-on:on_delete_item', 'slotProps.deleteItem(index)');
                    containerDiv.appendChild(head);

                    const rowDiv = document.createElement('div');
                    rowDiv.classList.add('row');

                    Array.from(row.children).forEach(child => {
                        rowDiv.appendChild(child);
                    });

                    containerDiv.appendChild(rowDiv);

                    newRow.appendChild(containerDiv);

                    $(newRow).children('div').children('div.row')
                        .children('[class^="col-sm-"]').children('[name]').each(function () {
                        var field = ($(this))[0];
                        const name = field.getAttribute('name');
                        field.setAttribute('v-model', `item['${name}']`);
                    })


                    row.parentNode.replaceChild(newRow, row);
                }
            });


            return dom.body.innerHTML.replace(/&quot;/g, `'`).replace("<br>", "\n");
        },

        /**
         * DB에서 로드된 내용을 KEditor에 적용할 수 있는 형태로 바꾸기 위해서
         */
        dynamicFormHTMLToKeditorContentHTML(html) {
            const dom = new DOMParser().parseFromString(html, 'text/html');


            const rows = dom.querySelectorAll('row-layout');
            rows.forEach(row => {
                const isMultiDataMode = row.getAttribute('is_multidata_mode');
                if (!isMultiDataMode || (isMultiDataMode === 'false')) {
                    const newRow = document.createElement('div');
                    

                    newRow.setAttribute('name', row.getAttribute('name') ?? "");
                    newRow.setAttribute('alias', row.getAttribute('alias') ?? "");
                    newRow.setAttribute('is_multidata_mode', row.getAttribute('is_multidata_mode') ?? "false");

                    newRow.setAttribute('class', 'row');


                    // Array.from(row.firstChild.children)
                    Array.from(row.firstElementChild.children).forEach(child => {
                        newRow.appendChild(child);
                    });

                    $(newRow).children('[class^="col-sm-"]').children('[v-model]').each(function () {
                        var field = ($(this))[0];
                        
                        field.removeAttribute('v-model');
                    });

                    $(newRow).children('[class^="col-sm-"]').children('*').each(function () {
                        var field = ($(this))[0];
                        
                        Array.from(field.attributes).forEach(attr => {
                            if (attr.name.startsWith('v-on:')) {
                                field.removeAttribute(attr.name);
                            }
                        });
                    });


                    row.parentNode.replaceChild(newRow, row);
                } else {
                    const newRow = document.createElement('div');
                    

                    newRow.setAttribute('name', row.getAttribute('name') ?? "");
                    newRow.setAttribute('alias', row.getAttribute('alias') ?? "");
                    newRow.setAttribute('is_multidata_mode', row.getAttribute('is_multidata_mode') ?? "false");

                    newRow.setAttribute('class', 'row');


                    $(row).children('div').children('div.row')
                        .children('[class^="col-sm-"]').each(function () {
                        var field = ($(this))[0];
                        newRow.appendChild(field);
                    })

                    $(newRow).children('[class^="col-sm-"]').children('[v-model]').each(function () {
                        var field = ($(this))[0];
                        field.removeAttribute('v-model');
                    })

                    $(newRow).children('[class^="col-sm-"]').children('*').each(function () {
                        var field = ($(this))[0];
                        Array.from(field.attributes).forEach(attr => {
                            if (attr.name.startsWith('v-on:')) {
                                field.removeAttribute(attr.name);
                            }
                        });
                    })


                    row.parentNode.replaceChild(newRow, row);
                }
            });


            return dom.body.innerHTML.replace(/&quot;/g, `'`).replace("<br>", "\n");
        },

        /**
         * 'Save' 버튼을 누를 경우, 최종 결과를 DB에 저장하기 위해서
         */
        async saveFormDefinition({ id, html }) {
            const existingForm = await this.backend.getRawDefinition(id, { type: 'form_def' });
            if (existingForm && existingForm.id !== "defaultform") {
                if (!confirm(`'${id}'는 이미 존재하는 폼 디자인 ID 입니다! 그래도 저장하시겠습니까?`)) return;
            }

            await this.backend.putRawDefinition(html, id, { 
                type: 'form',
                proc_def_id: existingForm?.proc_def_id,
                activity_id: existingForm?.activity_id
            });
            this.isOpenSaveDialog = false;

            this.kEditorContentBeforeSave = this.$refs.mashup.getKEditorContentHtml();
            this.isAIUpdated = false

            if(this.processDefUrlData) {
                const channel = new BroadcastChannel(this.processDefUrlData.channelId);
                channel.postMessage({
                    "name": this.processDefUrlData.formName,
                    "id": id
                })

                window.close();
            }
        },

        onClickPreviewSubmitButton() {
            const error = this.$refs.dynamicForm.validate()
            if (error && error.length > 0) alert(error)

            if (this.dev.isDevMode) this.dev.previewFormValues = JSON.stringify(this.previewFormValues);
            else alert(JSON.stringify(this.previewFormValues));
        },

        onClickPreviewApplyButton() {
            this.previewFormValues = JSON.parse(this.dev.previewFormValues);
        },

        /**
         * DB에서 Form 관련 데이터를 가져와서 KEditor에 반영하기 위해서 사용
         * @param {*} path
         */
        async loadData(path) {
            this.loadFormId = this.$route.params.pathMatch.join('/');
            if (this.loadFormId.startsWith('/')) {
                this.loadFormId = this.loadFormId.substring(1);
            } 
            this.isLoadedForm = (this.loadFormId && this.loadFormId != 'chat' && this.loadFormId != 'definition-map')

            this.isAIUpdated = false;
            this.messages = [];
            if (this.isLoadedForm) {
                try {
                    this.storedFormDefHTML = (await this.backend.getRawDefinition(this.loadFormId, { type: 'form' }));
                } catch(error) {
                    alert(`'${this.loadFormId}' ID 를 가지는 폼 디자인 정보가 없습니다! 새 폼 만들기 화면으로 이동됩니다.`);
                    this.$router.push(`/ui-definitions/chat`);
                    this.isShowMashup = true;
                    return;
                }

                const kEditorContentHTML = this.dynamicFormHTMLToKeditorContentHTML(this.storedFormDefHTML);
                const kEditorContent = this.loadHTMLToKEditorContent(kEditorContentHTML);
                this.applyNewSrcToMashup(kEditorContent);

                this.isShowMashup = true;
            } else {
                if(this.$refs.mashup) this.$refs.mashup.clearStat();
                this.isShowMashup = true;
            }
        },

        /**
         * AI에 메시지를 보내기 위해서 사용
         * @param {*} newMessage
         */
        beforeSendMessage(newMessage) {
            this.prevFormOutput = this.$refs.mashup.getKEditorContentHtml();
            newMessage.mentionedUsers = null;
            this.generator.sendMessageWithPrevFormOutput(newMessage);
        },

        /**
         * AI 메시지에서 실시간으로 JSON을 추출하기 위해서
         * @param {*} response
         */
        async afterModelCreated(response) {
            this.processResponse(response);
        },

        /**
         * 최종적인 AI 메시지에서 JSON을 추출하기 위해서
         * @param {*} response
         */
        afterGenerationFinished(response) {
            this.processResponse(response);
        },

        /**
         * AI의 결과물에서 JSON을 추출하고, 생성된 HTML을 보여주기 위해서
         */
        processResponse(response) {
            try {
                // AI의 응답에서 JSON을 추출하기 위해서
                let messageWriting = this.messages[this.messages.length - 1];
                messageWriting.jsonContent = this.extractLastJSON(response);
                messageWriting.content = messageWriting.content.replace(messageWriting.jsonContent, '');

                // messageWriting.jsonContent에 내용이 있어도, messageWriting.content에 내용이 없으면 메시지가 표시되지 않기때문에 추가함
                if(messageWriting.content.length == 0) messageWriting.content = "요청하신 폼 수정이 완료되었습니다."
                

                // 생성된 HTML을 보여주기 위해서
                if (messageWriting.jsonContent) {
                    if (messageWriting.jsonContent.htmlOutput) {
                        this.applyNewSrcToMashup(this.loadHTMLToKEditorContent(messageWriting.jsonContent.htmlOutput));
                    } else if (messageWriting.jsonContent.modifications) {
                        const modifiedPrevFormOutput = this.getModifiedPrevFormOutput(messageWriting.jsonContent.modifications);
                        this.applyNewSrcToMashup(this.loadHTMLToKEditorContent(modifiedPrevFormOutput));
                    } else console.error('알 수 없는 JSON 결과: ', JSON.stringify(messageWriting.jsonContent));
                    this.isAIUpdated = true;
                }

                this.isChanged = true;
            } catch (error) {
                console.log("[*] 폼 생성 관련 AI 응답 처리 과정에서 오류 발생!", {response, error});
            }
        },

        /**
         * 모델 생성을 도중에 멈춰도 결과를 처리가 가능한 경우에는 최대한 처리시키기 위해서
         */
        afterModelStopped(response) {
            // AI 생성을 멈춘 경우, 아무것도 반영시키기 않기 위해서
            console.log(response);
        },

        /**
         * 마지막 최종 결과 Html이 표시된 JSON을 추출하기 위해서
         */
        extractLastJSON(inputString) {
            const textFragments = inputString.split('```');
            for (let i = textFragments.length - 1; i >= 0; i--) {
                const textFragment = textFragments[i];
                if (!textFragment.includes('{') || !textFragment.includes('}')) continue;
                if (!textFragment.includes('htmlOutput') && !textFragment.includes('modifications')) continue;
                const isFirstCreated = textFragment.includes('htmlOutput');

                let fragmentToParse = '';
                try {
                    const processedFragment = textFragment
                        .match(/\{[\s\S]*\}/)[0]
                        .replaceAll('\n', '')
                        .replaceAll('`', `"`); // JSON에서 유효하지 않은 '\n', '`' 문자 제거

                    // AI가 잘못된 응답을 냈을 경우, 이를 대응하기 위한 수단들

                    // AI 응답이 `"` 문자열을 '\'로 파싱하지 않은 경우, 수동으로 파싱하기 위해서
                    if (isFirstCreated) {
                        const matchedHtmlOutput = processedFragment.match(/"htmlOutput"\s*:\s*"(.*)".*}/)[1];
                        if (matchedHtmlOutput.includes(`\\"`)) fragmentToParse = processedFragment;
                        else fragmentToParse = processedFragment.replace(matchedHtmlOutput, matchedHtmlOutput.replaceAll(`"`, `\\"`));
                    } else {
                        const matchedItems = [...processedFragment.matchAll(/items='\[(.*?)\]'>/g)].map((g) => g[1]);

                        fragmentToParse = processedFragment;
                        if (matchedItems) {
                            for (let j = 0; j < matchedItems.length; j++) {
                                const matchedItem = matchedItems[j];
                                if (!matchedItem.includes(`\\"`))
                                    fragmentToParse = fragmentToParse.replace(matchedItem, matchedItem.replaceAll(`"`, `\\"`));
                            }
                        }
                    }

                    // AI 응답이 items에서 items='[{'남자':'male'},{'여자':'female'}' 와 같이 '안에서 "로 감싸지 않은 경우, 이를 대응하기 위해서
                    const matchedItems = [...fragmentToParse.matchAll(/items='\[(.*?)\]'>/g)].map((g) => g[1]);
                    if (matchedItems) {
                        for (let j = 0; j < matchedItems.length; j++) {
                            const matchedItem = matchedItems[j];
                            if (matchedItem.includes(`'`)) {
                                fragmentToParse = fragmentToParse.replace(matchedItem, matchedItem.replaceAll(`'`, `\\"`));
                            }
                        }
                    }

                    // AI 응답에서 code-field 관련 필드의 문자열들을 파싱하기 위해서
                    const matchedCodeFields = [...fragmentToParse.matchAll(/<code-field .*?>(.*)<\/code-field>/g)].map((g) => g[1]);
                    if (matchedCodeFields) {
                        for (let j = 0; j < matchedCodeFields.length; j++) {
                            const matchedCodeField = matchedCodeFields[j];
                            if (!matchedCodeField.includes(`\\\\`)) {
                                fragmentToParse = fragmentToParse.replace(matchedCodeField, matchedCodeField.replaceAll(`\\`, `\\\\`));
                            }
                        }
                    }

                    // AI가 ">\"와 같은 이상한 응답을 하는 경우, 이를 제거하기 위해서
                    fragmentToParse = fragmentToParse.replace(/>\\n\\/g, '>');
                    fragmentToParse = fragmentToParse.replace(/>\\n/g, '>');
                    fragmentToParse = fragmentToParse.replace(/>\\/g, '>');
                } catch (error) {
                    console.log('### 유효 문자열을 JSON에 적합한 문자열로 변환시키는 과정에서 오류 발생! ###');
                    console.log(error);
                    console.log(textFragment);
                    return null;
                }

                try {
                    return JSON.parse(fragmentToParse);
                } catch (error) {
                    console.log('### JSON 문자열을 최종 파싱하는 과정에서 오류 발생! ###');
                    console.log(error);
                    console.log(textFragment);
                    console.log(fragmentToParse);
                    return null;
                }
            }

            return null;
        },

        /**
         * AI가 생성한 결과물을 KEditor에 적합한 Html 형식으로 변환하기 위해서
         * @param {*} htmlTextToLoad KEditor에 적합하게 변환시킬 로드된 HTML 코드
         */
        loadHTMLToKEditorContent(htmlTextToLoad) {
            const getUUID = () => {
                const s4 = () => {
                    return Math.floor((1 + Math.random()) * 0x10000)
                        .toString(16)
                    .substring(1);
                }

                return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
            }

            console.log('### 로드시킬 HTML 텍스트 ###');
            console.log(htmlTextToLoad);

            const dom = new DOMParser().parseFromString(htmlTextToLoad, 'text/html');


            // 만약 AI 생성오류 등으로 row안에 있는 col-sm-{숫자}의 총합이 12가 아니라면 모든 내용을 col-sm-12에 담아버림
            dom.querySelectorAll('div.row').forEach((row) => {

                let totalColSpaceSum = 0
                $(row).children('[class^="col-sm-"]').each(function () {
                    var col = ($(this))[0];

                    const colClassMatch = col.className.match(/col-sm-(\d+)/);
                    if (colClassMatch) {
                        const colSize = parseInt(colClassMatch[1], 10);
                        totalColSpaceSum += colSize;
                    }
                });

                if(totalColSpaceSum !== 12) {
                    const newCol = document.createElement('div');
                    newCol.setAttribute('class', 'col-sm-12');

                    $(row).children('[class^="col-sm-"]').each(function () {
                        var col = ($(this))[0];
                        Array.from(col.children).forEach(child => {
                            newCol.appendChild(child);
                        });
                    });

                    row.innerHTML = '';
                    row.appendChild(newCol);
                }

            });

            // 만약, AI가 class='row' 바깥에 section으로 감싸라는 지시를 제대로 따르지 못했을 경우, 적절하게 처리하기 위해서
            let isInvalidSectionParsing = false
            dom.querySelectorAll('div.row').forEach((row) => {
                if (row.parentElement.tagName.toLowerCase() !== 'section') {
                    isInvalidSectionParsing = true
                }
            });

            dom.querySelectorAll('section').forEach((section) => {
                if(section.children.length !== 1) {
                    isInvalidSectionParsing = true
                }
            });

            if(isInvalidSectionParsing) {
                // 특정 컴포넌트 안의 내용을 남겨주고, 그 컴포넌트를 제거 시킴
                const removeParentComponent = (parentComponent) => {
                    const parentSection = parentComponent.parentElement;
                    while (parentComponent.firstChild) {
                        parentSection.insertBefore(parentComponent.firstChild, parentComponent);
                    }
                        parentSection.removeChild(parentComponent);
                }

                const removeParentComponentByQuerySelector = (query) => {
                    dom.querySelectorAll(query).forEach(parentComponent => {
                        removeParentComponent(parentComponent)
                    })
                }

                removeParentComponentByQuerySelector('section');

                dom.querySelectorAll('div.row').forEach((row) => {
                    const section = document.createElement('section');
                    row.parentElement.insertBefore(section, row);
                    section.appendChild(row);
                });
            }


            // 컨테이너인 경우, data-type 속성을 추가해서 KEditor에서 인식할 수 있도록 만들기 위해서서
            const nodes = dom.querySelectorAll('[class^="col-sm-"]');
            nodes.forEach((node) => {
                node.setAttribute('data-type', 'container-content');
            });

            // 컴포넌트인 경우, `vuemount_${getUUID()}`를 id를 가지는 div로 감싸도록 만들기
            // 해당 div마다 추후에 createApp으로 렌더링의 대상이되고, ref를 통해서 접근할 수 있도록 함
            const components = Array.from(dom.querySelectorAll('*')).filter((el) => el.tagName.toLowerCase().endsWith('-field'));
            components.forEach((component) => {
                // 속성중에서 name인 경우, [가-힣a-zA-Z0-9_\-. ]에 해당하는 문자가 아닌 경우, 전부 제거함
                ['name'].forEach((attr) => {
                    if (component.hasAttribute(attr)) {
                        const validChars = component.getAttribute(attr).match(/[가-힣a-zA-Z0-9_\-. ]/g);
                        const cleanedAttr = validChars ? validChars.join('') : attr;
                        component.setAttribute(attr, cleanedAttr);
                    }
                });

                // 속성중에서 items인 경우, 키와 값 각각이 [가-힣a-zA-Z0-9_\-. ]에 해당하는 문자가 아닌 경우, 전부 제거함
                if (component.hasAttribute('items')) {
                    if(component.getAttribute('items').length == 0) {
                        component.setAttribute('items', '[]');
                    }
                    else if(component.getAttribute('items') !== "[]") {
                     
                        try {
                            // AI가 메뉴얼을 따르지 않고, '[A, B, ..., C]'와 같이 나열 연산자를 사용할 경우, 제거시켜버름
                            let items = JSON.parse(
                                component
                                    .getAttribute('items')
                                    .replace(/'/g, '"')
                                    .replace(/[ ]*,[ ]*\.\.\.[ ]*,[ ]*/, ',')
                            );
                            let newItems = [];

                            items.forEach((item) => {
                                Object.keys(item).forEach((key) => {
                                    const value = item[key];
                                    const validKeyChars = key.match(/[가-힣a-zA-Z0-9_\-. ]/g);
                                    const validValueChars = value.match(/[가-힣a-zA-Z0-9_\-. ]/g);

                                    const cleanedKey = validKeyChars ? validKeyChars.join('') : '';
                                    const cleanedValue = validValueChars ? validValueChars.join('') : '';
                                    newItems.push({ [cleanedKey]: cleanedValue });
                                });
                            });

                            component.setAttribute('items', JSON.stringify(newItems));
                        } catch (error) {
                            console.log(error);
                            component.setAttribute('items', '[]');
                        }

                    }
                }

                const parent = document.createElement('div');
                parent.setAttribute('id', `vuemount_${getUUID()}`);

                if (this.generator.availableComponentTagNames.includes(component.tagName.toLowerCase())) {
                    component.parentNode.insertBefore(parent, component);
                    parent.appendChild(component);
                }

                // 메뉴얼에 없는 태그를 사용할 경우의 AI 예외 처리
                // AI가 메뉴얼을 따르지 않고 다른 태그를 사용했을 경우, 적절한 태그로 생성시켜버리기
                else {
                    // items 속성을 가지고 있는 경우 select-field로 치환
                    if (component.hasAttribute('items')) {
                        const selectField = document.createElement('select-field');
                        selectField.setAttribute('name', component.getAttribute('name') ?? 'name');
                        selectField.setAttribute('alias', component.getAttribute('alias') ?? 'alias');
                        selectField.setAttribute('items', component.getAttribute('items') ?? '[]');

                        component.parentNode.insertBefore(parent, component);
                        parent.appendChild(selectField);
                        component.parentNode.removeChild(component);
                    }
                    // name이나 alias 속성을 가지고 있는 경우 text-field로 치환
                    else if (component.hasAttribute('name') || component.hasAttribute('alias')) {
                        const textField = document.createElement('text-field');
                        textField.setAttribute('name', component.getAttribute('name') ?? 'name');
                        textField.setAttribute('alias', component.getAttribute('alias') ?? 'alias');

                        component.parentNode.insertBefore(parent, component);
                        parent.appendChild(textField);
                        component.parentNode.removeChild(component);
                    }
                    // 처리 방법 없음. 무시
                    else component.parentNode.removeChild(component);
                }
            });


            // Section이 없는 경우, Section으로 감싸서 새로 생성하고, 있는 경우 그대로 사용함
            if(dom.body.querySelectorAll("section").length == 0) {
                const rows = Array.from(dom.body.querySelectorAll('.row'));
                dom.body.innerHTML = rows.map(row => {
                    const section = document.createElement('section');
                    section.innerHTML = row.outerHTML;
                    return section.outerHTML;
                }).join('').replace(/&quot;/g, `'`);
            }
            

            // KEdtior에서 인식할 수 있도록 클래스 추가하기
            Array.from(dom.body.querySelectorAll("section")).forEach(section => {
                section.setAttribute('class', 'keditor-container');
            });
            const loadedValidHTML = Array.from(dom.body.children).map(section => section.outerHTML).join('').replace(/&quot;/g, `'`).replace("<br>", "\n")


            console.log('### 로드된 유효 HTML 텍스트 ###');
            console.log(loadedValidHTML);
            return loadedValidHTML;
        },

        /**
         * mashup에 새로운 src를 제공해서 재랜더링하기 위해서
         */
        applyNewSrcToMashup(kEditorInput) {
            this.kEditorInput = kEditorInput;
            this.mashupKey += 1;

            if (this.currentTabName === 'preview')
                this.$nextTick(() => {
                    this.applyToPreviewTab();
                });
        },

        /**
         * 수정 지시사항에 따라서 수정된 HTML 결과물을 반환시킴
         */
        getModifiedPrevFormOutput(modifications) {
            const dom = new DOMParser().parseFromString(this.prevFormOutput, 'text/html');

            modifications.forEach((modification) => {
                if (modification.action === 'addAsChild') {
                    const parent = dom.querySelector(modification.targetCSSSelector);
                    const domToInsert = new DOMParser().parseFromString(modification.tagValue, 'text/html');
                    parent.appendChild(domToInsert.body.firstChild);
                } else if (modification.action === 'addAfter') {
                    const target = dom.querySelector(modification.targetCSSSelector);
                    const domToInsert = new DOMParser().parseFromString(modification.tagValue, 'text/html');
                    target.parentNode.insertBefore(domToInsert.body.firstChild, target.nextSibling);
                } else if (modification.action == 'replace') {
                    const target = dom.querySelector(modification.targetCSSSelector);
                    const domToReplace = new DOMParser().parseFromString(modification.tagValue, 'text/html');
                    target.parentNode.replaceChild(domToReplace.body.firstChild, target);
                } else if (modification.action === 'delete') {
                    const target = dom.querySelector(modification.targetCSSSelector);
                    target.parentNode.removeChild(target);
                }
            });

            const modifiedPrevFormOutput = dom.body.outerHTML.replace(/&quot;/g, `'`).replace("<br>", "\n");
            console.log('### 수정된 이전 폼 출력 ###');
            console.log(modifiedPrevFormOutput);
            return modifiedPrevFormOutput;
        },

        /**
         * 편집에서 변경된 사항들을 Preview쪽으로 전달시키기 위해서
         */
        applyToPreviewTab() {
            var me = this;

            me.isShowPreview = false;

            me.$try({
                context: me,
                action: async () => {
                    me.previewHTML = me.keditorContentHTMLToDynamicFormHTML(me.$refs.mashup.getKEditorContentHtml());
                },
                onFail: () => {
                    me.previewHTML = '';
                }
            });
            me.previewFormValues = {};
            me.isShowPreview = true;

            me.$nextTick(() => {
                me.dev.previewFormValues = JSON.stringify(me.previewFormValues);
            });
        },

        async deleteForm() {
            var me = this;
            me.$try({
                context: me,
                action: async () => {
                    await this.backend.deleteDefinition(this.loadFormId, {type: 'form'});
                    this.isOpenDeleteDialog = false;
                    if(window.location.pathname.includes('/ui-definitions/defaultform')) {
                        await this.$router.push('/ui-definitions/defaultform');
                    } else {
                        await this.$router.push('/ui-definitions/chat');
                    }
                    window.location.reload();
                },
                successMsg: this.$t('successMsg.delete')
            });
        }
    },

    beforeDestroy() {
        this.kEditorInput = null;
    },

    async beforeRouteLeave(to, from, next) {
        // 에러로 인해서 로드가 되지 않을 경우, 별도의 검사를 수행하지 않음
        if(!(this.$refs.mashup)) return next();

        if(this.isAIUpdated || (this.$refs.mashup.getKEditorContentHtml() != this.kEditorContentBeforeSave)) {
            const answer = window.confirm(this.$t('changePath'));
            if (answer) {
                next();
            } else {
                next(false);
            }
        } else {
            next();
        }
    },
};
</script>

<style scoped>
.full-width {
    width: 100%;
}
.icon-heartbit {
    color: rgb(var(--v-theme-primary)) !important;
    animation: icon-pulse 1.5s ease-in-out infinite;
    transform-origin: center;
}

@keyframes icon-pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.2);
        opacity: 0.8;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>
