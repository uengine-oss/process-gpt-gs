<template>
    <div>
        <div id="initGuide">
            <span style="font-size: 18px; font-weight: bold;">
                {{ $t('Mashup.hoverText') }}
            </span>
        </div>

        <div id="kEditor1" class="mashup-hover"></div>
        
        <v-dialog v-model="isOpenComponentSettingDialog">
            <form-definition-panel
                :componentRef="componentRefForSetting"
                @onSave="editFormDefinition"
                @onClose="isOpenComponentSettingDialog = false"
            ></form-definition-panel>
        </v-dialog>

        <v-dialog v-model="isOpenContainerSettingDialog">
            <container-setting-panel
                :sectionId="containerSectionId"
                :containerProps="containerProps"
                @onSave="editContainerDefinition"
                @onClose="isOpenContainerSettingDialog = false"
            ></container-setting-panel>
        </v-dialog>
    </div>
</template>

<script>
import { createApp } from 'vue';
import axios from 'axios';
import vuetify from "@/plugins/vuetify";
import hammerDirective from '@/components/directive/hammerDirective';
import ChatModule from "@/components/ChatModule.vue";
import FormDefinitionPanel from '@/components/designer/modeling/FormDefinitionPanel.vue';
import ContainerSettingPanel from '@/components/designer/modeling/ContainerSettingPanel.vue';
import DynamicComponent from './DynamicComponent.vue';

export default {
    name: 'mash-up',
    mixins: [ChatModule],
    components: {
        DynamicComponent,
        FormDefinitionPanel,
        ContainerSettingPanel
    },
    props: {
        modelValue: String
    },
    emits: [
        "onChangeKEditorContent",
        "onSaveFormDefinition",
        "onInitKEditorContent"
    ],
    expose: [
        "getKEditorContentHtml",
        "clearStat"
    ],
    data: () => ({
        kEditor: null,
        kEditorContent: `<div id="kEditor1"></div>`,

        componentRefForSetting: null,
        isOpenComponentSettingDialog: false,
        isOpenContainerSettingDialog: false,

        containerSectionId: "",
        containerProps: {name: "", alias: "", isMultiDataMode: false}
    }),
    computed: {
        mode() {
            return window.$mode;
        }
    },
    methods: {
        /**
         * KEditor에 어떠한 변화가 있을 경우, 이를 부모 컴포넌트에 전달하기 위해서
         * [!] 적제된 컴포넌트를 화살표 버튼으로 위치를 이동시켰을 경우, 발생하는 이벤트는 KEditor에 존재하지 않음에 유의
         *  이경우, 노출된 getKEditorContentHtml 함수를 통해서 직접 최신 HTML을 얻을 것
         */
        onchangeKEditor(evt, fnNm) {
            window.mashup.kEditorContent  = window.mashup.kEditor[0].children[0].innerHTML

            console.log("[*] onchangeKEditor 이벤트 => ", fnNm)
            window.mashup.$emit('onChangeKEditorContent', {
                kEditorContent: window.mashup.kEditorContent, 
                html: window.mashup.kEditorContentToHtml(window.mashup.kEditor[0].children[0].innerHTML, true)
            })
        },

        /**
         * KEditor와 관련된 스타일 파일들을 동적으로 추가시키기 위해서
         */
        loadStylesForKEditor() {
            const cssFiles = [
                '/css/keditor.css',
                // 불필요한 스타일이라 생각해 주석 추후 문제 발생시 복구
                // '/css/keditor-component-text.css'
            ];

            cssFiles.forEach(cssFile => {
                const styleLink = document.createElement('link');
                styleLink.rel = 'stylesheet';
                styleLink.href = cssFile;
                styleLink.classList.add('keditor-stylesheet'); // 고유 클래스 추가
                document.head.appendChild(styleLink);
            });
        },

        /**
         * KEditor와 관련된 스타일 파일들을 동적으로 삭제시키기 위해서
         */
        removeStylesForKEditor() {
            document.querySelectorAll('.keditor-stylesheet').forEach(link => {
                document.head.removeChild(link);
            });
        },


        /**
         * KEditor를 조작한 모든 내용을 초기화시키기 위해서
         */
        clearStat() {
            window.mashup.kEditor[0].children[0].innerHTML = ""
            window.mashup.kEditorContent = ""
          
            window.mashup.$emit('onChangeKEditorContent', {
                kEditorContent: "", 
                html: ""
            })
        },


        /**
         * KEditor의 content에 대해서 저장되는 HTML 내용을 얻기 위해서
         */
        getKEditorContentHtml() {
            return window.mashup.kEditorContentToHtml(window.mashup.kEditor[0].children[0].innerHTML)
        },

        /**
         * KEditor의 Content를 HTML로 변환하기 위해서
         * @param {*} kEditorContent KEditor 내부의 innerHTML
         * @param {*} isWithSection <section> 태그로 결과를 감싸는지 여부
         */
        kEditorContentToHtml(kEditorContent, isWithSection = true) {
            let parser = new DOMParser();
            let doc = parser.parseFromString(kEditorContent, 'text/html');


            // 렌더링된 Vue 컴포넌트를 찾아서 다시 vue 태그로 되돌리기 위해서
            doc.querySelectorAll("div[id^='vuemount_']").forEach(vueRenderElement => {
                const vueRenderUUID = vueRenderElement.id
                const componentRef = window.mashup.componentRefs[vueRenderUUID]

                const newElement = document.createElement(componentRef.tagName)
                componentRef.settingInfos.forEach(settingInfo => {
                    if(settingInfo.settingType === 'items')
                        newElement.setAttribute(settingInfo.htmlAttribute, JSON.stringify(componentRef[settingInfo.dataToUse]))
                    else if(settingInfo.addOns && settingInfo.addOns.includes("savedAsInnerText")) {
                        if(settingInfo.addOns.includes("encodedAsBase64"))
                            newElement.innerText = decodeURIComponent(atob(componentRef[settingInfo.dataToUse]))
                        else
                            newElement.innerText = componentRef[settingInfo.dataToUse]
                    }
                    else
                        newElement.setAttribute(settingInfo.htmlAttribute, componentRef[settingInfo.dataToUse])
                })

                vueRenderElement.innerHTML = newElement.outerHTML
            })


            doc.querySelectorAll('div.keditor-toolbar').forEach(toolbar => {
                toolbar.remove();
            });

            // 특정 컴포넌트 안의 내용을 남겨주고, 그 컴포넌트를 제거 시킴
            const removeParentComponent = (parentComponent) => {
                const parentSection = parentComponent.parentElement;
                while (parentComponent.firstChild) {
                    parentSection.insertBefore(parentComponent.firstChild, parentComponent);
                }
                parentSection.removeChild(parentComponent);
            }

            const removeParentComponentByQuerySelector = (query) => {
                doc.querySelectorAll(query).forEach(parentComponent => {
                    removeParentComponent(parentComponent)
                })
            }
          
            // id가 "vuemount_"로 시작하는 모든 요소들을 찾아서 제거시키기 위해서
            removeParentComponentByQuerySelector('[id^="vuemount_"]')
            removeParentComponentByQuerySelector('section.keditor-component-content')
            removeParentComponentByQuerySelector('section.keditor-initialized-component')
            removeParentComponentByQuerySelector('section.keditor-initializing-component')
            removeParentComponentByQuerySelector('section.keditor-container-inner:not(.keditor-container)')

            // 모든 section.keditor-initialized-container에 대해서 모든 class 및 id를 제거하는 과정을 수행
            doc.querySelectorAll('section.keditor-initialized-container').forEach(section => {
                section.removeAttribute('class');
                section.removeAttribute('id');
            });

            // 칼럼이 되는 class를 찾아서 불필요한 클래스 및 속성들을 제거시키기 위해서
            doc.querySelectorAll('[class^="col-sm-"]').forEach(node => {
                node.setAttribute("class", node.getAttribute("class").split(" ").filter((className) => className.includes("col-sm-")).join(" "))
                node.removeAttribute('id')
                node.removeAttribute('data-type')
            });


            if(isWithSection)
                return doc.body.innerHTML.replace(/&quot;/g, `'`).replace("<br>", "\n");
            else
                return doc.body.firstChild.innerHTML.replace(/&quot;/g, `'`).replace("<br>", "\n")
        },


        /**
         * 유저가 설정창을 통해서 변경한 값을 컴포넌트에 반영시키기 위해서
         * @param {*} newValue 유저가 새롭게 설정한 값
         */
        editFormDefinition(componentRef, componentProps) {
            componentRef.settingInfos.forEach(settingInfo => {
                componentRef[settingInfo.dataToUse] = componentProps[settingInfo.dataToUse]
            })

            window.mashup.isOpenComponentSettingDialog = false
        },

        /**
         * 유저가 설정창을 통해서 변경한 값은 해당 컨테이너에 반영시키기 위해서
         * @param {*} sectionId 해당 컨테이너를 감싸는 section 태그에 할당딘 ID
         * @param {*} localContainerProps 변경시킬 컨테이너의 속성들
         */
        editContainerDefinition(sectionId, localContainerProps) {
            console.log("[*] editContainerDefinition  : ", sectionId, localContainerProps)

            const rowToModify = $(`section#${sectionId} .row`)[0]
            rowToModify.setAttribute('name', localContainerProps.name)
            rowToModify.setAttribute('alias', localContainerProps.alias)
            rowToModify.setAttribute('is_multidata_mode', String(localContainerProps.isMultiDataMode))

            window.mashup.isOpenContainerSettingDialog = false
        },

        /**
         * KEditor를 완전하게 제거시키기 위해서
         */
        completeClearKEditor() {
            $("body").off('click', '.btn-container-setting')
            $("body").off('click', '.btn-container-duplicate')
            $("body").off('click', '.btn-container-delete')

            $("body").off('click', '.btn-component-setting')
            $("body").off('click', '.btn-component-duplicate')
            $("body").off('click', '.btn-component-delete')
            $("body").off('dblclick', '.keditor-component')

            document.body.classList.remove('initialized-click-event-handlers')
            document.body.classList.remove('initialized-snippets-list')

            $('.keditor-content-area').remove()
            $(".keditor-ui").remove()
            $('#kEditor1').data('keditor', null)
        },


        renderWithDynamicComponent(snippetContent, vueRenderUUID, isCopy = false) {
            const snipptDom = new DOMParser().parseFromString(snippetContent, 'text/html')

            if(isCopy) {
                snipptDom.body.querySelectorAll("[name]").forEach(
                    (el) => el.setAttribute("name", el.getAttribute("name") + `-copy`)
                )
            } else {
                const nameSeq = Object.values(window.mashup.componentRefs).filter(componentRef => componentRef.localName).length + 1
                snipptDom.body.querySelectorAll("[name]").forEach(
                    (el) => el.setAttribute("name", el.getAttribute("name") + `-${nameSeq}`)
                )
            }

            const app = createApp(DynamicComponent, {content:snipptDom.body.innerHTML, vueRenderUUID:vueRenderUUID})
                            .use(vuetify)
                            .directive('hammer', hammerDirective)
                            .mount('#'+vueRenderUUID);
            window.mashup.componentRefs[vueRenderUUID] = app.componentRef;
        },

        /**
         * 유저가 입력할 수 있는 컴포넌트들의 Name 목록을 반환하기 위해서
         */
        getUserInputableComponentNames() {
            return Object.values(window.mashup.componentRefs)
                .filter(componentRef => (componentRef.tagName.toLowerCase() !== 'code-field') && (componentRef.localName !== undefined) && (componentRef.localAlias !== undefined))
                .map(componentRef => componentRef.localName)
        },

        /**
         * keditor 사이드바 토글러에 테마 색상 적용
         */
        applyThemeColorToKeditorSidebar() {
            // localStorage에서 테마 색상 가져오기
            const savedSettings = JSON.parse(localStorage.getItem('userSettings') ?? '{}');
            const themeColor = savedSettings.themeColorCode || '#0085DB';
            
            // keditor 사이드바 토글러 요소 선택
            const sidebarToggler = document.querySelector('#keditor-sidebar-toggler');
            if (sidebarToggler) {
                sidebarToggler.style.backgroundColor = themeColor;
                sidebarToggler.style.color = 'white';
                sidebarToggler.style.border = `1px solid ${themeColor}`;
            }
            
            // localStorage 변경 감지하여 색상 업데이트
            window.addEventListener('storage', (event) => {
                if (event.key === 'userSettings') {
                    try {
                        const newSettings = JSON.parse(event.newValue || '{}');
                        if (newSettings.themeColorCode) {
                            const newThemeColor = newSettings.themeColorCode;
                            const sidebarToggler = document.querySelector('#keditor-sidebar-toggler');
                            if (sidebarToggler) {
                                sidebarToggler.style.backgroundColor = newThemeColor;
                                sidebarToggler.style.border = `1px solid ${newThemeColor}`;
                            }
                        }
                    } catch (e) {
                        console.error('테마 색상 파싱 오류:', e);
                    }
                }
            });
        },
    },
    mounted() {
        window.mashup = this
        window.mashup.completeClearKEditor()

        window.mashup.loadStylesForKEditor();
        
        window.mashup.kEditor = $('#kEditor1');
        if (window.mashup.modelValue) 
            $(window.mashup.kEditor)[0].innerHTML = window.mashup.modelValue;


        window.mashup.kEditor.keditor({
            tabContainersText: '<i class="fa fa-th-list"></i>',
            tabComponentsText: '<i class="fa fa-file"></i>',
            extraTabs: {
                setting: {
                    text: '<i class="fa fa-cogs"></i>',
                    title: 'Settings',
                    content: (
                        '<div class="form-horizontal">' +
                        '   <button class="btn btn-primary btn-lg" style="width:100%" id="clearBtn">Clear</button>' +
                        '</div>'
                    )
                }
            },
            niceScrollEnabled: false,
            tabTooltipEnabled: false,
            snippetsTooltipEnabled: false,
            containerSettingEnabled: true,
            onInitSidebar: function (self) {
                const headers = {
                    'Content-type': 'html; charset=UTF-8',
                    'Accept': '*/*'
                }

                axios.get(`${window.location.origin}/snippets/default/snippets.html`, {headers}).then(function (resp) {
                    console.log("axios result", resp);

                    self.renderSnippets(resp.data);
                    self.initSnippets();
                    self.initTabs();
                    self.initTabsSwitcher();
                    self.initSettingPanel();

                    if (self.options.snippetsFilterEnabled) {
                        self.initSnippetsFilter('Container');
                        self.initSnippetsFilter('Component');
                    }

                    if (self.options.snippetsTooltipEnabled || self.options.tabTooltipEnabled) {
                        self.body.find('#' + self.options.snippetsListId).find('[data-toggle="tooltip"]').tooltip();
                    }
                })
            },

            containerSettingInitFunction: function (form, keditor) {
                $("#clearBtn").on("click", function (e) {
                    window.mashup.clearStat();
                })
                console.log("containerSettingInitFunction  : ", form, keditor);
                form.append(
                    '<div class="form-horizontal">' +
                    '   <h3>Here is Setting Container Panel!</h3>' +
                    '</div>'
                );
            },


            /**
             * 새롭게 컴포넌트를 드래그해서 추가시에 Vue 컴포넌트인 경우, 렌더링을 시키기 위해서
             */
            onContentChanged: function (event, snippetContent, vueRenderUUID) {
                $("#initGuide").css("display", "none")

                if(snippetContent && vueRenderUUID && vueRenderUUID.includes("vuemount_"))
                    window.mashup.renderWithDynamicComponent(snippetContent, vueRenderUUID, false)
                    
                window.mashup.onchangeKEditor(event, 'onContentChanged');
            },

            /**
             * 유저가 컴포넌트 세팅 버튼을 누를 경우, 편집과 관련된 다이얼로그를 보여주기 위해서
             * @param {*} container 선택된 영역에 해당하는 keditor-component section 선택자
             */
            componentSettingShowFunction: function (form, container, keditor) {
                console.log("componentSettingShowFunction : ", form, container, keditor)

                try {
                    const vueRenderElement = (new DOMParser()).parseFromString(container[0].innerHTML, 'text/html')
                                                .querySelectorAll("div[id^='vuemount_']")
                    if (vueRenderElement.length == 0) {
                        alert("선택된 입력 요소가 없습니다.")
                        return
                    }


                    const componentRef = window.mashup.componentRefs[vueRenderElement[0].id]
                    if ((!(componentRef.settingInfos)) || (componentRef.settingInfos.length <= 0)) {
                        alert("해당 입력 요소에 대해서 추가적으로 세팅할 수 있는 항목이 없습니다.")
                        return
                    }

                    componentRef.settingInfos.forEach(settingInfo => {
                        if(settingInfo.addOns && settingInfo.addOns.includes("inputableNameItems"))
                            settingInfo.settingValue = window.mashup.getUserInputableComponentNames()
                    })

                    window.mashup.componentRefForSetting = componentRef
                    window.mashup.isOpenComponentSettingDialog = true

                } catch(e) {
                    console.error(e);
                }
            },


            onInitComponent: function (comp) {
                const getUUID = () => {
                    const s4 = () => {
                        return Math.floor((1 + Math.random()) * 0x10000)
                        .toString(16)
                        .substring(1);
                    }

                    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
                }

                window.mashup.onchangeKEditor(comp, 'onInitComponent');

                
                if(comp.hasClass("keditor-container")) {
                    // 컨테이너 복제시에 복제된 컨테이너와 관련해서 일부 속성들을 새롭게 설정하기 위해서
                    if (comp && comp.length > 0) {
                        comp[0].setAttribute("id", `keditor-container-${(new Date()).getTime()}`)
                    }
                } else {
                    // 컴포넌트 복제시에 복제된 컴포넌트가 제대로 렌더링되도록 만들기 위해서
                    if(comp && comp.length > 0 && comp[0].querySelectorAll("div[id^='vuemount_']").length > 0) {
                        const prevVueRenderId = comp[0].querySelectorAll("div[id^='vuemount_']")[0].getAttribute("id")
                        if(prevVueRenderId) {
                            const renderedComponents = window.mashup.kEditor[0].children[0].querySelectorAll(`div[id='${prevVueRenderId}']`)
                            if(renderedComponents.length == 2) {
                                let htmlToRender = window.mashup.kEditorContentToHtml(renderedComponents[0].outerHTML, !(renderedComponents[0].tagName.toLowerCase() === "section"))
                                htmlToRender = `<div id="${renderedComponents[0].getAttribute("id")}" data-v-app>${htmlToRender}</div>`
                                
                                const newVueRenderId = `vuemount_${getUUID()}`
                                htmlToRender = htmlToRender.replace(prevVueRenderId, newVueRenderId)
                                comp[0].querySelector(".keditor-component-content").innerHTML = htmlToRender

                                window.mashup.renderWithDynamicComponent((new DOMParser().parseFromString(htmlToRender, 'text/html')).body.firstChild.innerHTML, newVueRenderId, true)
                            }
                        }
                    }
                }
            },
            onComponentChanged: function (event) {
                window.mashup.onchangeKEditor(event, 'onComponentChanged');
            },

            initContentAreas: function (self, contentAreas) {
                console.log('initContentAreas', self, contentAreas)
            },
            componentSettingHideFunction: function (form, keditor) {
                console.log("componentSettingHideFunction : ", form, keditor);
            },
            containerSettingShowFunction: function (form, container, keditor) {
                console.log("containerSettingShowFunction : ", form, container, keditor);

                const dom = (new DOMParser()).parseFromString(container[0].outerHTML, 'text/html')
                window.mashup.containerSectionId = dom.querySelector('section').id

                const row = dom.querySelector('.row')
                window.mashup.containerProps = {
                    name: row ? row.getAttribute('name') || "" : "",
                    alias: row ? row.getAttribute('alias') || "" : "",
                    isMultiDataMode: row ? (row.getAttribute('is_multidata_mode') === 'true') : false
                }


                window.mashup.isOpenContainerSettingDialog = true
            },
            containerSettingHideFunction: function (form, keditor) {
                console.log("containerSettingHideFunction : ", form, keditor);
            },

            onReady: function () {
                // 컴포넌트 설정 버튼 클릭시, 오른쪽 설정 패널이 뜨는 버그 수정
                $("#keditor-setting-panel").remove()
                
                // keditor 사이드바 토글러에 테마 색상 적용
                window.mashup.applyThemeColorToKeditorSidebar();
            },
        });

        // 처음 로드시에 Vue 컴포넌트들을 각각 별도의 createApp으로 렌더링시키고, 참조자 딕셔너리를 구성하기 위해서
        window.mashup.componentRefs = {}
        if (window.mashup.modelValue) {
            $("#initGuide").css("display", "none")
            const parser = new DOMParser();
            const doc = parser.parseFromString(window.mashup.modelValue, 'text/html');

            const codeFields = doc.querySelectorAll('code-field');
            codeFields.forEach(field => {
                const innerText = field.innerText;
                const encodedText = btoa(encodeURIComponent(innerText));
                field.setAttribute('encoded_code', encodedText);
                field.innerText = '';
            });

            doc.querySelectorAll("div[id^='vuemount_']").forEach(vueRenderElement => {
                // AI가 태그를 이상하게 생성했을 경우, 이곳에서 에러가 발생할 수 있음. 일단 넘기도록 처리함
                try {
                    const vueRenderUUID = vueRenderElement.id
                    const app = createApp(DynamicComponent, {content:vueRenderElement.innerHTML, vueRenderUUID:vueRenderUUID})
                        .use(vuetify)
                        .directive('hammer', hammerDirective)
                        .mount('#'+vueRenderUUID);
                    window.mashup.componentRefs[vueRenderUUID] = app.componentRef;

                } catch(e) {
                    console.log("### KEditor에서 Vue 컴포넌트 렌더링시에 오류 발생 ! ###")
                    console.log("window.mashup.modelValue: ", window.mashup.modelValue)
                    console.log("vueRenderElement: ", vueRenderElement)
                    console.error(e)
                }
            })
        }

        window.mashup.kEditorContent  = window.mashup.kEditor[0].children[0].innerHTML
        window.mashup.$emit('onInitKEditorContent', window.mashup.getKEditorContentHtml())
    },

    beforeUnmount() {
        window.mashup.removeStylesForKEditor();
        window.mashup.completeClearKEditor();
    }
}
</script>

<style scoped>
.right-panel {
    position: fixed; /* 패널을 화면 우측에 고정 */
    top: 0; /* 상단에서부터 시작 */
    right: 0; /* 우측에서부터 시작 */
    width: 30%; /* 너비는 화면의 30% */
    height: 100vh; /* 높이는 화면 전체 */
    background-color: #f5f5f5; /* 배경색 설정 */
    padding: 20px; /* 내용과 경계 사이의 여백 */
    box-sizing: border-box; /* 패딩을 포함한 너비 계산 */
    overflow-y: auto; /* 내용이 넘칠 경우 스크롤바 표시 */
    z-index: 999999;
}

#initGuide {
    width:100%;
    height: 70px;
    width:100%;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>