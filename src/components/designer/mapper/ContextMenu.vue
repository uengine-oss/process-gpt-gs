<template>
    <v-menu v-model="showMenu" :position-x="positionX" :position-y="positionY" absolute :close-on-content-click="false">
        <v-list v-model:opened="open" class="unselectable">
            <v-list-item v-for="(item, index) in filteredMenuItems" :key="`item-${index}`" @click.stop="selectItem(item)">
                <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>

            <v-list-group v-for="(group, index) in menuItemsWithSubmenu" :key="`group-${index}`" :value="group.title" @click.stop="">
                <template v-slot:activator="{ props }">
                    <v-list-item v-bind="props">
                        <v-list-item-title>{{ group.title }}</v-list-item-title>
                    </v-list-item>
                </template>

                <v-list-item v-for="(subItem, subIndex) in group.submenu" :key="`subitem-${subIndex}`" @click.stop="selectItem(subItem)">
                    <v-list-item-title>{{ subItem.title }}</v-list-item-title>
                </v-list-item>
            </v-list-group>
        </v-list>
    </v-menu>
</template>

<script>
export default {
    name: 'ContextMenu',
    props: {
        menuItems: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            showMenu: false,
            positionX: 0,
            positionY: 0,
            open: [] // 여기에 기본적으로 열려 있어야 하는 메뉴 그룹의 타이틀을 배열로 추가
        };
    },
    computed: {
        filteredMenuItems() {
            return this.menuItems.filter((item) => !item.submenu);
        },
        menuItemsWithSubmenu() {
            return this.menuItems.filter((item) => item.submenu);
        }
    },
    methods: {
        showContextMenu(x, y) {
            this.positionX = x;
            this.positionY = y;
            this.showMenu = true;
        },
        selectItem(item) {
            this.$emit('menu_item_selected', item);
            this.showMenu = false;
        }
    }
};
</script>

<style scoped>
.align-left {
    text-align: left;
}
.unselectable {
    -webkit-user-select: none; /* Safari */
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+/Edge */
    user-select: none; /* Standard */
}
</style>
