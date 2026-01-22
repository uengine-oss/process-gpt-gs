import { assign } from 'min-dash';
import ReplaceMenuProvider from 'bpmn-js/lib/features/popup-menu/ReplaceMenuProvider';
import { i18n } from '@/main';

export default class CustomReplaceMenuProvider extends ReplaceMenuProvider {
  constructor(
    bpmnFactory, popupMenu, modeling, moddle, bpmnReplace, rules, translate, moddleCopy) {
    super(bpmnFactory, popupMenu, modeling, moddle, bpmnReplace, rules, translate, moddleCopy);
    this.bpmnFactory = bpmnFactory;
    this.popupMenu = popupMenu;
    this.modeling = modeling;
    this.moddle = moddle;
    this.bpmnReplace = bpmnReplace;
    this.rules = rules;
    this.translate = translate;
    this.moddleCopy = moddleCopy;
  }

  _createEntries(target, replaceOptions) {
    const entries = ReplaceMenuProvider.prototype._createEntries.call(this, target, replaceOptions);
    Object.keys(entries).forEach(key => {
      if (entries[key].label) {
        const translationKey = `CustomReplaceElement.${key}`;
        entries[key].label = i18n.global.t(translationKey);
      }
    });
    return entries;
  }

  getPopupMenuHeaderEntries(target) {
    const headerEntries = ReplaceMenuProvider.prototype.getPopupMenuHeaderEntries.call(this, target);
    Object.keys(headerEntries).forEach(key => {
      if (headerEntries[key].title) {
        const translationKey = `CustomReplaceElement.${key}`;
        headerEntries[key].title = i18n.global.t(translationKey);
      }
    });
    return headerEntries;
  }
}

CustomReplaceMenuProvider.$inject = [
  'bpmnFactory',
  'popupMenu',
  'modeling',
  'moddle',
  'bpmnReplace',
  'rules',
  'translate',
  'moddleCopy'
];

// CustomReplaceMenuProvider.prototype = Object.create(ReplaceMenuProvider.prototype);

// CustomReplaceMenuProvider.prototype._createEntries = function(target, replaceOptions) {
//   const entries = ReplaceMenuProvider.prototype._createEntries.call(this, target, replaceOptions);
//   delete entries["replace-with-conditional-intermediate-catch"]
//   Object.keys(entries).forEach(key => {
//     if (entries[key].label) {
//       const translationKey = `CustomReplaceElement.${key}`;
//       entries[key].label = i18n.global.t(translationKey);
//     }
//   });
//   return entries;
// };

// CustomReplaceMenuProvider.prototype.getPopupMenuHeaderEntries = function(target) {
//   const headerEntries = ReplaceMenuProvider.prototype.getPopupMenuHeaderEntries.call(this, target);
//   Object.keys(headerEntries).forEach(key => {
//     if (headerEntries[key].title) {
//       const translationKey = `CustomReplaceElement.${key}`;
//       headerEntries[key].title = i18n.global.t(translationKey);
//     }
//   });

//   return headerEntries;
// };