<script>
import { h, ref } from 'vue';
import TextField from '@/components/ui/field/TextField.vue';
import SelectField from '@/components/ui/field/SelectField.vue';
import CheckboxField from '@/components/ui/field/CheckboxField.vue';
import RadioField from '@/components/ui/field/RadioField.vue';
import FileField from '@/components/ui/field/FileField.vue';
import LabelField from '@/components/ui/field/LabelField.vue';
import BooleanField from '@/components/ui/field/BooleanField.vue';
import TextareaField from '@/components/ui/field/TextareaField.vue';
import UserSelectField from '@/components/ui/field/UserSelectField.vue';
import CodeField from '@/components/ui/field/CodeField.vue';
import ReportField from '@/components/ui/field/ReportField.vue';
import SlideField from '@/components/ui/field/SlideField.vue';
import BpmnUengineField from '@/components/ui/field/BpmnUengineField.vue';

export default {
  props: {
    content: {
      type: String,
      default: '',
    },
    vueRenderUUID: {
      type: String,
      default: ''
    }
  },

  setup() {
    const componentRef = ref(null);

    const createComponentWithRef = (component, props) => {
      return h(component, {
        ...props,
        ref: (instance) => {
          if (instance) {
            componentRef.value = instance;
          }
        },
      });
    };

    const parseContentToProps = (content) => {
      const dom = new DOMParser().parseFromString(content, 'text/html');
      const element = dom.body.firstChild;
      const props = {};
      if (element) {
        Array.from(element.attributes).forEach(attr => {
          props[attr.name] = attr.value;
        });
      }
      return props;
    };

    return {
      componentRef,
      createComponentWithRef,
      parseContentToProps
    };
  },

  render() {
    const dom = new DOMParser().parseFromString(this.content, 'text/html');
    const element = dom.body.firstChild;
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case "text-field":
        return this.createComponentWithRef(TextField, {vueRenderUUID:this.vueRenderUUID, tagName: tagName, ...this.parseContentToProps(this.content)});
      case "select-field":
        return this.createComponentWithRef(SelectField, {vueRenderUUID:this.vueRenderUUID, tagName: tagName, ...this.parseContentToProps(this.content)});
      case "checkbox-field":
        return this.createComponentWithRef(CheckboxField, {vueRenderUUID:this.vueRenderUUID, tagName: tagName, ...this.parseContentToProps(this.content)});
      case "radio-field":
        return this.createComponentWithRef(RadioField, {vueRenderUUID:this.vueRenderUUID, tagName: tagName, ...this.parseContentToProps(this.content)});
      case "file-field":
        return this.createComponentWithRef(FileField, {vueRenderUUID:this.vueRenderUUID, tagName: tagName, ...this.parseContentToProps(this.content)});
      case "label-field":
        return this.createComponentWithRef(LabelField, {vueRenderUUID:this.vueRenderUUID, tagName: tagName, ...this.parseContentToProps(this.content)});
      case "boolean-field":
        return this.createComponentWithRef(BooleanField, {vueRenderUUID:this.vueRenderUUID, tagName: tagName, ...this.parseContentToProps(this.content)});
      case "textarea-field":
        return this.createComponentWithRef(TextareaField, {vueRenderUUID:this.vueRenderUUID, tagName: tagName, ...this.parseContentToProps(this.content)});
      case "user-select-field":
        return this.createComponentWithRef(UserSelectField, {vueRenderUUID:this.vueRenderUUID, tagName: tagName, ...this.parseContentToProps(this.content)});
      case "code-field":
        return this.createComponentWithRef(CodeField, {vueRenderUUID:this.vueRenderUUID, tagName: tagName, ...this.parseContentToProps(this.content)});
      case "report-field":
        return this.createComponentWithRef(ReportField, {vueRenderUUID:this.vueRenderUUID, tagName: tagName, ...this.parseContentToProps(this.content)});
      case "slide-field":
        return this.createComponentWithRef(SlideField, {vueRenderUUID:this.vueRenderUUID, tagName: tagName, ...this.parseContentToProps(this.content)});
      case "bpmn-uengine-field":
        return this.createComponentWithRef(BpmnUengineField, {vueRenderUUID:this.vueRenderUUID, tagName: tagName, ...this.parseContentToProps(this.content)});
      default:
        console.error("유효하지 않은 렌더링 content:", this.content)
        return "";
    }
  }
};
</script>