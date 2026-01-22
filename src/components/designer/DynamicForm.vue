<script>
/**
 * formHTML: HTML 폼 데이터를 전달해서 렌더링하기 위해서
 * v-model: 이 값을 세팅해서 입력 요소에 값을 세팅하거나 받을 수 있음
 *    {"name1":"value1", "name2":"key1"} 과 같이 전달되며, "name1"은 해당 태그의 name 속성 값임(name은 고유하다고 가정)
 *    text-field: Read("value1"과 같은 문자열 값) / Write("value1"과 같은 문자열 값) 
 *    select-field: Read("key1"과 같은 유저가 선택한 키 값) / Write("key1"과 같은 선택시킬 값)
 *    checkbox-field: Read(["key1", "key2"]) 와 같이 체크된 항목의 객체 값들을 담은 리스트) / Write(Read와 동일)
 *    radio-field: Read("key1"과 같은 키 값과 같은 선택된 객체의 값) / Write(Read와 동일)
 *    file-field: Read(선택된 파일의 Base64 URL 주소) / Write(지원하지 않음)
 *    label-field: Read(지원하지 않음) / Write(지원하지 않음)
 *    boolean-field: Read(true/false) / Write(true/false)
 *    textarea-field: Read("value1"과 같은 문자열 값) / Write("value1"과 같은 문자열 값) 
 *    user-select-field: Read(["id1", "id2"]) 와 같이 선택된 유저 ID 값들을 담은 리스트) / Write(Read와 동일)
 *    report-field: Read(마크다운 형식의 컨텐츠) / Write(마크다운 형식의 텍스트)
 *    slide-field: Read(슬라이드 형식의 컨텐츠) / Write(슬라이드 형식의 텍스트)
 *    bpmn-uengine-field: Read(BPMN XML 문자열) / Write(BPMN XML 문자열)
 */
import { h } from 'vue';
import TextField from '@/components/ui/field/TextField.vue';
import SelectField from '@/components/ui/field/SelectField.vue';
import CheckboxField from '@/components/ui/field/CheckboxField.vue';
import RadioField from '@/components/ui/field/RadioField.vue';
import FileField from '@/components/ui/field/FileField.vue';
import LabelField from '@/components/ui/field/LabelField.vue';
import BooleanField from '@/components/ui/field/BooleanField.vue';
import TextareaField from '@/components/ui/field/TextareaField.vue';
import UserSelectField from '@/components/ui/field/UserSelectField.vue';
import RowLayout from '@/components/ui/field/RowLayout.vue';
import RowLayoutItemHead from '@/components/ui/field/RowLayoutItemHead.vue';
import CodeField from '@/components/ui/field/CodeField.vue';
import ReportField from '@/components/ui/field/ReportField.vue';
import SlideField from '@/components/ui/field/SlideField.vue';
import BpmnUengineField from '@/components/ui/field/BpmnUengineField.vue';

export default {
  props: {
    // 폼 HTML 데이터를 전달시켜서 렌더링시키기 위해서
    formHTML: {
      type: String,
      default: '',
    },
    readonly: {
      type: Boolean,
      default: false
    },
    modelValue: Object
  },

  emits: [
    "validate",
    "update:modelValue"
  ],

  watch: {
    readonly: {
      handler(newVal) {
        this.updateFormHTML(this.formHTML, newVal)
      },
      immediate: true
    },

    formHTML: {
      handler(newHTML) {
          this.updateFormHTML(newHTML, this.readonly);
      },
      immediate: true
    },

    modelValue: {
      handler() {
        if(JSON.stringify(this.formValues) === JSON.stringify(this.modelValue)) return

        this.formValues = this.modelValue
        this.cachedHFunc = null
      },
      deep: true,
      immediate: true
    },

    formValues: {
      handler(newVal, oldVal) {
        if (newVal && typeof newVal === 'object' && newVal.isTrusted !== undefined && Object.keys(newVal).length <= 3) {
          this.lastValidFormValues = oldVal;
          return;
        }

        if(JSON.stringify(newVal) === JSON.stringify(this.modelValue)) return

        this.$emit('update:modelValue', newVal)
      },
      deep: true,
      immediate: true
    }
  },

  data() {
    return {
      renderedContent: "",
      formValues: {},
      cachedHFunc: null, // 중복 렌더링을 피하기 위해서
      codeInfos: {},
      copyFormHTML: '',
      lastValidFormValues: {} // 입력한 폼 값이 유실되는 걸 방지하기 위해서
    }
  },

  methods: {
    /**
     * 유저가 정의한 검증 함수들을 실행시켜서 에러가 있으면 반환하고, 없으면 null을 반환함
     */
    validate() {
      for(const key in this.codeInfos) {
        const codeInfo = this.codeInfos[key]
        if(codeInfo.eventType === "validate") {
          const error = this.executeCode(key)
          if(error && error.length > 0) return error
        }
      }

      return null
    },

    executeCode(name) {
      let error = null
      eval(this.codeInfos[name].code)
      return error
    },

    updateFormHTML(newHTML, readonly) {
      this.copyFormHTML = (readonly) ? this._setReadOnlyToAllFields(newHTML) : newHTML;
      this.cachedHFunc = null;
    },

    _setReadOnlyToAllFields(targetHTML) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(targetHTML, 'text/html');

        const fields = doc.querySelectorAll('text-field, select-field, checkbox-field, radio-field, file-field, boolean-field, textarea-field, user-select-field, report-field, slide-field, bpmn-uengine-field');

        fields.forEach(field => {
          field.setAttribute('readonly', 'true');
        });

        return doc.body.innerHTML;
      } catch (error) {
        console.error("Error processing form HTML for readonly state:", error);
        return targetHTML;
      }
    }
  },

  created() {
    // readonly가 아닌 경우(편집/미리보기 모드)에만 EventBus 이벤트를 처리
    // readonly인 경우(채팅 메시지 폼)는 무시하여 의도치 않은 업데이트 방지
    this.EventBus.on('updatePreviewHTML', (newHTML) => {
      if (!this.readonly) {
        this.updateFormHTML(newHTML);
      }
    });
  },

  /**
   * 'console.log(JSON.stringify(this.formValues))'과 같이 this.formValues의 값을 접근해서 로깅하지 말 것
   * Vue의 render 추적 대상에 읽기 동작만으로 포함되기 때문에 예상치 못한 동작이 일어남
   * 로깅을 하고 싶을 경우, updated와 같은 다른 함수에서 할 것
   */
  render() {
    const me = this

    const r = {
      components: {
        TextField,
        ReportField,
        SlideField,
        BpmnUengineField,
        SelectField,
        CheckboxField,
        RadioField,
        FileField,
        LabelField,
        BooleanField,
        TextareaField,
        UserSelectField,
        RowLayout,
        RowLayoutItemHead,
        CodeField
      },
      data() {
        return {
          formValues: me.formValues,

          codeInfos: {},
          oldFormValues: {}
        }
      },
      methods: {
        executeCode(name) {
          return me.executeCode(name)
        }
      },
      mounted() {
        me.codeInfos = this.codeInfos

        this.oldFormValues = JSON.parse(JSON.stringify(this.formValues))
        this.$watch(`formValues`, (newVal, oldVal) => {
          Object.keys(this.codeInfos).forEach(key => {
            const codeInfo = this.codeInfos[key]
            if((codeInfo.eventType === "watch") && 
               (this.oldFormValues[codeInfo.watchName] !== this.formValues[codeInfo.watchName])) {
              this.executeCode(key)
            }
          })
          this.oldFormValues = JSON.parse(JSON.stringify(this.formValues))
        }, {deep: true})

        Object.keys(this.codeInfos).forEach(key => {
          const codeInfo = this.codeInfos[key]
          if(codeInfo.eventType === "initialize") {
            this.executeCode(key)
          }
        })
      },
      template: `<div id="kEditor1">
  ${me.copyFormHTML}
</div>`
    }

    if(this.cachedHFunc) return this.cachedHFunc
    this.cachedHFunc = h(r)
    return this.cachedHFunc;
  },
};
</script>