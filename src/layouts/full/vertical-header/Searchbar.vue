<template>
    <!-- ---------------------------------------------- -->
    <!-- search -->
    <!-- ------------------------------------------------>
    <v-menu v-model="searchMenuOpen" :close-on-content-click="false" class="search_popup">
        <template v-slot:activator="{ props }">
            <div v-bind="props">
                <div>
                    <div class="d-flex align-center flex-fill border border-borderColor header-search rounded-pill px-5 ">
                        <Icons :icon="'magnifer-linear'" :size="22" />
                        <v-text-field v-model="searchKeyword" variant="plain" density="compact"
                            class="position-relative pt-0 ml-3 custom-placeholer-color" 
                            :placeholder="$t('headerMenu.search')"
                            single-line hide-details
                            @keyup.enter="search"
                        ></v-text-field>
                    </div>
                </div>
            </div>
        </template>

        <!-- Search Result -->
        <v-sheet class="main-search-box" elevation="10" rounded="md">
            <h5 class="text-h5 pa-4">{{ $t('headerMenu.searchResult') }}</h5>
            <div style="max-height: 500px; overflow: auto;">
                <v-list v-if="searching" class="pt-0 pb-5" lines="two">
                    <v-list-subheader class="d-flex align-center">
                        {{ $t('headerMenu.searching') }}
                        <v-progress-circular indeterminate size="16" width="2" class="ml-2" color="primary"></v-progress-circular>
                    </v-list-subheader>
                </v-list>
                <v-list v-else-if="!hasSearched" class="pt-0 pb-5" lines="two">
                    <div class="px-4 py-2 text-caption text-medium-emphasis" style="white-space: normal; word-wrap: break-word; line-height: 1.4;">
                        {{ $t('headerMenu.searchKeyword') }}
                    </div>
                </v-list>
                <v-list v-else-if="searchResult.length > 0" class="pt-0 pb-5" lines="two">
                    <div v-for="category in searchResult" :key="category.type" class="py-1">
                        <v-divider inset></v-divider>
                        <v-list-subheader class="text-caption">
                            {{ category.header.includes('.') ? $t(category.header) : category.header }}
                        </v-list-subheader>
                        <v-list-item v-for="(item, index) in category.list" :key="index" :to="item.href" class="px-5 py-2" @click="searchMenuOpen = false">
                            <template v-if="item.img" v-slot:prepend>
                                <v-avatar size="32" class="mr-3">
                                    <v-img :src="item.img" :alt="item.title" cover></v-img>
                                </v-avatar>
                            </template>
                            <v-list-item-title>
                                <h6 class="text-subtitle-1 font-weight-medium mb-1">{{ item.title }}</h6>
                            </v-list-item-title>
                            <v-list-item-subtitle>
                                <p class="text-subtitle-2 text-medium-emphasis">{{ summarize(item.matches[0]) }}</p>
                            </v-list-item-subtitle>
                        </v-list-item>
                    </div>
                </v-list>
                <v-list v-else class="pt-0 pb-5" lines="two">
                    <v-list-subheader>{{ $t('headerMenu.noSearchResult') }}</v-list-subheader>
                </v-list>
            </div>
        </v-sheet>
    </v-menu>
</template>

<script>
import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    data: () => ({
        searchKeyword: "",
        searchResult: [],
        searching: false,
        searchMenuOpen: false,
        hasSearched: false
    }),
    watch: {
        searchKeyword(newVal, oldVal) {
            if (newVal.length == 0 || (newVal != oldVal && !this.searching)) {
                this.searchResult = [];
                this.hasSearched = false;
            }
        },
        searchResult: {
            deep: true,
            handler(newVal) {
                if (newVal) {
                    // console.log(newVal);
                }
            }
        }
    },
    methods: {
        async search() {
            if (this.searchKeyword.length == 0) {
                this.searching = false;
                this.searchResult = [];
                return;
            }
            this.searchMenuOpen = true;
            this.searching = true;
            this.searchResult = [];

            try {
                await backend.search(this.searchKeyword, (updated) => {
                    this.searchResult = updated;
                });
            } catch (e) {
                console.error('검색 중 에러 발생:', e);
                this.searchResult = [];
            } finally {
                this.searching = false;
                this.hasSearched = true;
            }
        },
        summarize(text) {
            if (text && text.length > 0) {
                const startIndex = text.indexOf(this.searchKeyword);
                if (startIndex !== -1) {
                    const endIndex = Math.min(startIndex + 40, text.length);
                    return text.substring(startIndex, endIndex) + (endIndex < text.length ? '...' : '');
                }
                return text.length > 40 ? text.substring(0, 40) + '...' : text;
            }
            return '';
        }
    },
}
</script>

