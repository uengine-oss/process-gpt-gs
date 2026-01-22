<template>
    <div>
        <v-row class="ma-0 pa-0 form-definition-chat-box">
            <v-col v-if="type === 'edit'"
                class="pa-0 overflow-y-auto"
                style="height: calc(100vh - 260px);"
            >
                <div v-if="isShowMashup">
                    <mashup ref="mashup" v-model="kEditorInput" :key="mashupKey"  
                        @onInitKEditorContent="updateKEditorContentBeforeSave"
                        @onChangeKEditorContent="changedKEditorContent"
                        @update:modelValue="(val) => (modelValue = val)" />
                </div>
                <div v-else class="align-self-center">
                    <v-progress-circular color="primary" indeterminate></v-progress-circular>
                </div>
            </v-col>
            <!-- 오른쪽 세로선 추가 (한글 주석) -->
            <v-divider vertical v-if="type !== 'preview'"></v-divider>

            <v-col v-if="type === 'preview'" 
                class="pa-0 pl-4 overflow-y-auto"
                style="height: calc(100vh - 260px);"
            >
                <template v-if="isShowPreview">
                    <DynamicForm class="form-definition-preview-form" ref="dynamicForm" :formHTML="previewHTML" v-model="previewFormValues"></DynamicForm>
                    <!-- <template v-if="dev.isDevMode">
                        <v-textarea label="previewFormValuesToTest" rows="10" v-model="dev.previewFormValues"></v-textarea>
                        <v-btn color="primary" class="full-width my-5" @click="onClickPreviewApplyButton">적용</v-btn>
                    </template>

                    <v-row class="ma-0 pa-0">
                        <v-spacer></v-spacer>
                        <v-btn color="primary" @click="onClickPreviewSubmitButton">제출</v-btn>
                    </v-row> -->
                </template>
                <div v-else class="align-self-center">
                    <v-progress-circular color="primary" indeterminate></v-progress-circular>
                </div>
            </v-col>
            <v-col v-if="type != 'preview'"
                :class="type == 'simulation' ? '':'ml-auto'"
                :style="type == 'simulation' ? '' : 'max-width: 250px; height: calc(100vh - 260px) !important; overflow: auto;'"
                class="pa-0 form-definition-simulation-chat-box"
            >
                <Chat :chatInfo="chatInfo"
                    :messages="messages"
                    :userInfo="userInfo"
                    :type="type == 'simulation' ? 'form_simulation':'form'"
                    @sendMessage="beforeSendMessage"
                    @sendEditedMessage="sendEditedMessage"
                    @stopMessage="stopMessage"
                >
                    <template v-slot:custom-title>
                        <div></div>
                    </template>
                </Chat>
            </v-col>
        </v-row>
    </div>
</template>

<script>
import Mashup from '@/components/designer/Mashup.vue';
import FormDesignSavePanel from '@/components/designer/FormDesignSavePanel.vue';
import ChatModule from './ChatModule.vue';
import ChatGenerator from './ai/FormDesignGenerator';
import Chat from './ui/Chat.vue';
import DynamicForm from '@/components/designer/DynamicForm.vue';
import FormDefinitionModule from './FormDefinitionModule.vue';
import BackendFactory from '@/components/api/BackendFactory';

const backend = BackendFactory.createBackend();

export default {
    mixins: [ChatModule, FormDefinitionModule],
    props: {
        type: {
            type: String,
            default: 'edit'
        },
        formId: {
            type: String,
            default: ''
        },
        modelValue: {
            type: String,
            default: ''
        },
        simulation_data: {
            type: Object,
            default: {}
        }
    },
    components: {
        Chat,
        Mashup,
        ChatGenerator,
        FormDesignSavePanel,
        DynamicForm
    },
    data: () => ({
        chatInfo: {
            title: '',
            text: 'uiDefinition.uiDefinitionExplanation'
        },

        kEditorInput: ``, // Mashup 컴포넌트의 KEditor을 업데이트하기 위해서 전달되는 값
        mashupKey: 0, // kEditorInput가 변경되었을 경우, Mashup 컴포넌트를 다시 렌더링하기 위해서

        kEditorContent: '',

        prevFormOutput: '', // 폼 디자이너에게 이미 이전에 생성된 HTML 결과물을 전달하기 위해서
        prevMessageFormat: '', // 사용자가 KEditor를 변경할때마다 해당 포맷을 기반으로 System 메시지를 재구축해서 보내기 위해서

        formHTML: "",
        isShowMashup: false,
        
        previewHTML: '',
        previewFormValues: {},
        isShowPreview: false,

        dev: {
            isDevMode: window.localStorage.getItem('isDevMode') === 'true',
            previewFormValues: ''
        },

        isAIUpdated: false,
        isRoutedWithUnsaved: false,
        datasourceURL: null,
        datasourceSchema: null,
    }),
    async created() {
        // const reloadOnConnectionFailure = async () => {
        //     if (!(await this.storage.isConnection())) {
        //         const reloadOnConnectionSuccess = async () => {
        //             if(await this.storage.isConnection())
        //                 this.$router.go(0);
        //             else
        //                 setTimeout(reloadOnConnectionSuccess, 500);
        //         }
        //         setTimeout(reloadOnConnectionSuccess, 500);
        //     }
        // }
        // reloadOnConnectionFailure()

        if (this.modelValue != '') {
            this.kEditorInput = this.dynamicFormHTMLToKeditorContentHTML(this.modelValue);
        }

        const isUseDataSource = localStorage.getItem('isUseDataSource');
        if(isUseDataSource == 'true') {
            this.$try({
                context: this,
                action: async () => {
                    const schema = await backend.extractDatasourceSchema();
                    this.datasourceSchema = Array.isArray(schema) ? schema : [];
                    this.datasourceURL = this.datasourceSchema.map(item => item.endpoint);
                },
                errorMsg: '데이터소스 스키마 연동 실패'
            });
        }

        this.generator = new ChatGenerator(this, {
            isStream: true,
            preferredLanguage: 'Korean'
        });
        await this.init();
    },
    computed: {
        isMobile() {
            return window.innerWidth <= 768;
        },
    },
    watch: {
        type(newVal, oldVal) {
            if (newVal === 'edit') {
                this.applyNewSrcToMashup(this.modelValue);
            } else {
                this.applyToPreviewTab();
            }
        },
        previewHTML: {
            handler(newVal) {
                this.EventBus.emit('updatePreviewHTML', newVal);
            },  
            immediate: true
        },
    },
    methods: {
        getFormHTML() {
            if (this.$refs.mashup) {
                const kEditorContent = this.$refs.mashup.getKEditorContentHtml();
                return this.keditorContentHTMLToDynamicFormHTML(kEditorContent);
            } else {
                return this.formHTML;
            }
        },
        changedKEditorContent(value) {
            this.formHTML = this.keditorContentHTMLToDynamicFormHTML(value.html);
            this.$emit('update:modelValue', this.formHTML);
        },
        updateKEditorContentBeforeSave(kEditorContent) {
            // this.kEditorContentBeforeSave = kEditorContent;
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


                    Array.from(row.firstChild.children).forEach(child => {
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
        async saveFormDefinition() {
            // const DynamicFormHTML = this.keditorContentHTMLToDynamicFormHTML(this.modelValue);

            if (this.formId !== '' && this.formId !== null) {
                const options = {
                    type: 'form',
                    proc_def_id: this.simulation_data.proc_def_id ? this.simulation_data.proc_def_id : null,
                    activity_id: this.simulation_data.element_id ? this.simulation_data.element_id : null
                }
                if(window.location.pathname == '/definition-map'){
                    localStorage.setItem(this.formId, this.previewHTML);
                } else {
                    await this.backend.putRawDefinition(this.previewHTML, this.formId, options);
                }
            } else {
                //
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
            this.isShowMashup = false;
            this.formHTML = (await this.backend.getRawDefinition(this.formId, { type: 'form' }));

            let tempHTML = ''
            if (this.modelValue) {
                tempHTML = this.dynamicFormHTMLToKeditorContentHTML(this.modelValue);
            } else {
                tempHTML = this.dynamicFormHTMLToKeditorContentHTML(this.formHTML);
            }
            const kEditorContent = this.loadHTMLToKEditorContent(tempHTML);
            this.applyNewSrcToMashup(kEditorContent);
            this.isShowMashup = true;

            this.applyToPreviewTab();
        },

        /**
         * AI에 메시지를 보내기 위해서 사용
         * @param {*} newMessage
         */
        beforeSendMessage(newMessage) {
            if(this.type == 'simulation'){
                this.prevFormOutput = this.dynamicFormHTMLToKeditorContentHTML(this.modelValue);
            } else {
                this.prevFormOutput = this.$refs.mashup.getKEditorContentHtml();
            }
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
            if(this.type == 'simulation'){
                this.saveFormDefinition('afterGenerationFinished');
            }
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
                if(messageWriting.content.length == 0) messageWriting.content = " "
                

                // 생성된 HTML을 보여주기 위해서
                if (messageWriting.jsonContent) {
                    if (messageWriting.jsonContent.htmlOutput) {
                        this.$emit('update:modelValue', messageWriting.jsonContent.htmlOutput);
                        this.applyNewSrcToMashup(this.loadHTMLToKEditorContent(messageWriting.jsonContent.htmlOutput));
                        this.previewHTML = this.keditorContentHTMLToDynamicFormHTML(messageWriting.jsonContent.htmlOutput);
                    } else if (messageWriting.jsonContent.modifications) {
                        const modifiedPrevFormOutput = this.getModifiedPrevFormOutput(messageWriting.jsonContent.modifications);
                        this.applyNewSrcToMashup(this.loadHTMLToKEditorContent(modifiedPrevFormOutput));
                        this.previewHTML = this.keditorContentHTMLToDynamicFormHTML(modifiedPrevFormOutput);
                        messageWriting.content = "요청하신 폼 수정이 완료되었습니다."
                    } else console.error('알 수 없는 JSON 결과: ', JSON.stringify(messageWriting.jsonContent));
                    this.isAIUpdated = true;
                }
            } catch (error) {
                console.log(error);
                let messageWriting = this.messages[this.messages.length - 1];
                messageWriting.content = "폼 수정중 오류가 발생하였습니다. 잠시 후 다시 시도해주세요."
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
         * AI가 생성한 결과물을 KEditor에 적합한 Html 형식으로 변환하기 위해서
         * @param {*} htmlTextToLoad KEditor에 적합하게 변환시킬 로드된 HTML 코드
         */
        loadHTMLToKEditorContent(htmlTextToLoad) {
            if (!htmlTextToLoad) return '';

            const getUUID = () => {
                const s4 = () => {
                    return Math.floor((1 + Math.random()) * 0x10000)
                        .toString(16)
                    .substring(1);
                }

                return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
            }

            // console.log('### 로드시킬 HTML 텍스트 ###');
            // console.log(htmlTextToLoad);

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

            // console.log('### 로드된 유효 HTML 텍스트 ###');
            // console.log(loadedValidHTML);
            return loadedValidHTML;
        },

        /**
         * mashup에 새로운 src를 제공해서 재랜더링하기 위해서
         */
        applyNewSrcToMashup(kEditorInput) {
            this.kEditorInput = kEditorInput;
            this.mashupKey += 1;
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

                if(modification.action === 'addAsChild' || modification.action === 'addAfter'){
                    this.$emit('addedNewForm')
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
                    if (me.modelValue) {
                        me.previewHTML = me.keditorContentHTMLToDynamicFormHTML(me.modelValue);
                    } else {
                        me.previewHTML = me.keditorContentHTMLToDynamicFormHTML(me.formHTML);
                    }
                    console.log('### 프리뷰 HTML ###');
                    console.log(me.previewHTML);
                },
                onFail: () => {
                    me.previewHTML = '';
                }
            });
            me.previewFormValues = {};
            
            me.$nextTick(() => {
                me.isShowPreview = true;
                me.dev.previewFormValues = JSON.stringify(me.previewFormValues);
            });
        },
        
    },

    async beforeRouteLeave(to, from, next) {
        // 에러로 인해서 로드가 되지 않을 경우, 별도의 검사를 수행하지 않음
        if(!(this.$refs.mashup)) return next();

        if(this.isAIUpdated || (this.$refs.mashup.getKEditorContentHtml() != this.kEditorContent)) {
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
</style>
