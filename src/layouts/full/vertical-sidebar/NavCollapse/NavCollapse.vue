<template>
    <div class="mb-1" :key="bindKey">
        <DropDown v-if="!item.directory"
            :item="item"
            :level="level + 1"
        ></DropDown>
        <v-list-group v-else no-action v-model="isOpen">
            <template v-slot:activator="{ props }">
                <v-list-item 
                    v-bind="props" 
                    :value="item.title" 
                    :ripple="false" 
                    :class="'bg-hover-' + item.BgColor" 
                    :color="item.BgColor"
                >
                    <!---Icon  -->
                    <template v-slot:prepend>
                        <div :class="'navbox  bg-hover-' + item.BgColor" :color="item.BgColor">
                            <span class="icon-box" v-if="level > 0">
                                <Icons :icon="'outline-folder'" />
                            </span>
                            <span class="icon-box" v-else>
                                <Icons
                                    :icon="item.icon"
                                    :level="level"
                                    :class="'position-relative z-index-2 texthover-' + item.BgColor"
                                />
                            </span>
                        </div>
                    </template>
                    <!---Title  -->
                    <v-tooltip :text="item.title">
                        <template v-slot:activator="{ props }">
                            <v-list-item-title
                                class="text-medium-emphasis cp-menu mt-0 ml-2"
                                v-bind="props"
                            >{{ item.title }}
                            </v-list-item-title>
                        </template>
                    </v-tooltip>
                    <!---If Caption-->
                    <v-tooltip v-if="item.subCaption" :text="item.subCaption">
                        <template v-slot:activator="{ props }">
                            <v-list-item-subtitle
                                class="text-caption mt-n1 hide-menu"
                                v-bind="props"
                            >
                                {{ item.subCaption }}
                            </v-list-item-subtitle>
                        </template>
                    </v-tooltip>
                </v-list-item>
            </template>
            <div class="mb-4 sublinks">
                <!-- 정의목록 폴더 내부 내용 보여주는곳 -->
                <template v-for="(subitem, i) in item.children" :key="i">
                    <template v-if="item.children">
                        <NavCollapse :item="subitem" v-if="subitem.directory" style="margin-left:20px;" :level="level + 1"/>
                        <NavCollapse :item="subitem" v-else-if="subitem.children" :level="level + 1" />
                        <DropDown :item="subitem" style="margin-left:20px;" :level="level + 1" v-else></DropDown>
                    </template>
                </template>
            </div>
        </v-list-group>
    </div>
</template>


<script>
import BackendFactory from '@/components/api/BackendFactory';
import DropDown from '../DropDown/index.vue';

const backend = BackendFactory.createBackend();
export default {
    components: {
        DropDown
    },
    props: {
        item: Object,
        level: Number,
        type: String,
    },
    data() {
        return {
            bindKey: 0,
            isOpen: false,
        };
    },
    mounted() {
        var me = this;
        me.$nextTick(() => {
            setTimeout(() => {
                me.isOpen = true;
            }, 100);
        });
    },
    methods: {
        updateItem() {
            this.$emit('update:item', this.item);
        },
    }
}

// const getChild = async (subitem, i) => {
//     let res = await backend.listDefinition(subitem.title);
//     let menu = [];
//     res.forEach((el) => {
//         var obj = {
//             title: el.name.split('.')[0],
//             type: el.name.split('.')[1]
//         };

//         if (el.directory) {
//             obj.directory = true;
//             obj.children = [];
//         } else {
//             if (el.name.split('.')[1] == 'form') {
//                 obj.to = `/ui-definitions/${el.path.split('.')[0]}`;
//             } else {
//                 obj.to = `/definitions/${el.path.split('.')[0]}`;
//             }
//         }
//         menu.push(obj);
//     });
//     props.item.children[i]['children'] = menu;
//     let copy = JSON.parse(JSON.stringify(props.item));
//     emit('update:item', copy);
// };
</script>
