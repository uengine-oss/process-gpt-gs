<template>
    <div>
        <v-row class="ma-0 pa-0">
            <v-col cols="3" class="pa-4">
                <v-list>
                    <template v-for="(guideSlide, index) in guideSlides" :key="index">
                        <v-list-item
                            v-for="(item, itemIndex) in guideSlide.items" :key="itemIndex"
                            :class="{'active-slide': activeIndex === index + '_' + itemIndex}"
                            @click="scrollToSlide(index, itemIndex)"
                        >
                            <v-list-item-title>{{ $t(item.title) }}</v-list-item-title>
                        </v-list-item>
                    </template>
                </v-list>
            </v-col>
            <v-col cols="9" class="tenant-info-box pa-4"
                style="height:calc(100vh - 50px); overflow:auto;"
                @scroll="handleScroll"
            >
                <template v-for="(guideSlide, index) in guideSlides" :key="index">
                    <div v-for="(item, itemIndex) in guideSlide.items" :key="itemIndex" class="mb-16">
                        <h2 class="text-grey200" :ref="'slide' + index + '_' + itemIndex">{{ $t(item.title) }}</h2>
                        <template v-for="(image, imageIndex) in item.images" :key="imageIndex">
                            <img :src="image" :class="image == '/src/assets/images/tenant/help/1.png' ? 'create-account-img' : 'tenant-info-image'"/>
                        </template>
                        <div style="font-size:18px;" v-for="(desc, descIndex) in item.description" :key="descIndex" v-html="$t(desc)"></div>
                        <template v-for="(textField, textFieldIndex) in item.textFields" :key="textFieldIndex">
                            <div v-if="textField.value" class="d-flex tenant-info-text-filed">
                                <VTextField
                                    :value="getTenantUrl(value.id)" 
                                    type="text"
                                    readonly
                                ></VTextField>
                                <v-tooltip text="Copy">
                                    <template v-slot:activator="{ props }">
                                        <v-btn v-bind="props" icon variant="text" @click="copyToClipboard">
                                            <v-icon>mdi-content-copy</v-icon>
                                        </v-btn>
                                    </template>
                                </v-tooltip>
                            </div>
                            <VTextField v-else v-model="value.id"
                                :label="textField.label"
                                :type="textField.type"
                                :ref="textField.ref"
                                :readonly="isEdit || textField.disabled"
                                class="tenant-info-text-filed"
                                hint="* 영어, 숫자, 하이픈(-)만 입력 가능합니다."
                                persistent-hint
                                required
                            ></VTextField>
                        </template>
                    </div>
                </template>
                <v-row no-gutters class="pa-0 pb-16">
                    <v-btn 
                        size="large" 
                        class="mt-2" 
                        color="primary"  
                        rounded="pill"
                        type="submit"
                        :loading="isLoading"
                        @click="createInfoTenant()"
                    >생성하기</v-btn>
                </v-row>
            </v-col>
        </v-row>
    </div>
</template>

<script>
// import createAccount from '@/assets/images/tenant/help/1.png';
// import selectNewProject from '@/assets/images/tenant/help/2.png';
// import createOrganization from '@/assets/images/tenant/help/3.png';
// import createProject from '@/assets/images/tenant/help/4.png';
// import apiUrlCopy from '@/assets/images/tenant/help/5.png';
// import secretCopy from '@/assets/images/tenant/help/6.png';
// import databaseCopy from '@/assets/images/tenant/help/7.png';
import siteUrl from '@/assets/images/tenant/help/8.png';
import { getTenantUrl } from '@/utils/domainUtils';

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    name: 'TenantInfoField',
    props: {
        modelValue: {
            type: Object,
            required: true,
        },
        isEdit: {
            type: Boolean,
            default: false
        },
        isLoading: Boolean
    },
    emits: ['update:modelValue'],
    expose: ['validCheck'],

    computed: {
        value: {
            get() {
                return this.modelValue
            },
            set(value) {
                this.$emit('update:modelValue', value)
            }
        }
    },

    data: () => ({
        activeIndex: 0,
        guideSlides: [
            // { 
            //     step: 1,
            //     items: [
            //         {
            //             title: 'tenantInfoField.step1',
            //             images: [
            //                 createAccount
            //             ],
            //             description: [
            //                 'tenantInfoField.step1-text',
            //             ]
            //         }
            //     ]
            // },
            // {
            //     step: 2,
            //     items: [
            //         {
            //             title: 'tenantInfoField.step2-1',
            //             images: [
            //                 selectNewProject
            //             ],
            //             description: [
            //                 'tenantInfoField.step2-1-text'
            //             ]
            //         },
            //         {
            //             title: 'tenantInfoField.step2-2',
            //             images: [
            //                 createOrganization
            //             ],
            //             description: [
            //                 'tenantInfoField.step2-2-text'
            //             ]
            //         },
            //         {
            //             title: 'tenantInfoField.step2-3',
            //             images: [
            //                 createProject
            //             ],
            //             description: [
            //                 'tenantInfoField.step2-3-text',
            //             ],
            //             textFields: [
            //                 {
            //                     label: 'Database Password',
            //                     type: 'password',
            //                     model: 'password',
            //                     ref: 'password',
            //                 }
            //             ]
            //         }
            //     ]
            // },
            // {
            //     step: 3,
            //     items: [
            //         {
            //             title: 'tenantInfoField.step3-1',
            //             images: [
            //                 apiUrlCopy
            //             ],
            //             description: [
            //                 'tenantInfoField.step3-1-text'
            //             ],
            //             textFields: [
            //                 {
            //                     label: 'URL',
            //                     type: 'url',
            //                     model: 'url',
            //                     ref: 'url',
            //                 },
            //             ]
            //         },
            //         {
            //             title: 'tenantInfoField.step3-2',
            //             images: [
            //                 secretCopy
            //             ],
            //             description: [
            //                 'tenantInfoField.step3-2-text'
            //             ],
            //             textFields: [
            //                 {
            //                     label: 'Secret',
            //                     type: 'password',
            //                     model: 'secret',
            //                     ref: 'secret',
            //                 },
            //             ]
            //         },
            //         {
            //             title: 'tenantInfoField.step3-3',
            //             images: [
            //                 databaseCopy
            //             ],
            //             description: [
            //                 'tenantInfoField.step3-3-text'
            //             ],
            //             textFields: [
            //                 {
            //                     label: 'Host',
            //                     type: 'url',
            //                     model: 'host',
            //                     ref: 'host',
            //                 },
            //                 {
            //                     label: 'Database Name',
            //                     type: 'text',
            //                     model: 'databaseName',
            //                     ref: 'databaseName',
            //                 },
            //                 {
            //                     label: 'Port',
            //                     type: 'number',
            //                     model: 'port',
            //                     ref: 'port',
            //                 },
            //                 {
            //                     label: 'User',
            //                     type: 'text',
            //                     model: 'user',
            //                     ref: 'user',
            //                 },
            //             ]
            //         },
            //     ]
            // },
            {
                step: 1,
                items: [
                    {
                        title: 'tenantInfoField.step4',
                        description: [
                            'tenantInfoField.step4-text'
                        ],
                        textFields: [
                            {
                                label: '회사 ID',
                                type: 'text',
                                model: 'id',
                                ref: 'tenantId',
                            },
                        ]
                    },
                ]
            },
            // {
            //     step: 2,
            //     items: [
            //         {
            //             title: 'tenantInfoField.step5',
            //             images: [
            //                 siteUrl
            //             ],
            //             description: [
            //                 'tenantInfoField.step5-text'
            //             ],
            //             textFields: [
            //                 {
            //                     label: 'Site URL',
            //                     disabled: true,
            //                     value: true
            //                 },
            //             ]
            //         }
            //     ]
            // }
        ],
    }),

    async created() {
    },

    methods: {
        getModel(model) {
            return model
        },
        createInfoTenant() {
            this.$emit('beforeCreateTenant');
        },
        handleScroll() {
            const slideKeys = Object.keys(this.$refs).filter(key => key.startsWith('slide'));
            slideKeys.forEach((key) => {
                const slides = this.$refs[key];
                slides.forEach((slide) => {
                    if (slide) {
                        const rect = slide.getBoundingClientRect();
                        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                            this.activeIndex = key.replace('slide', '');
                        }
                    }
                });
            });
        },
        scrollToSlide(index, itemIndex) {
            const slide = this.$refs['slide' + index + '_' + itemIndex];
            if (slide && slide[0]) {
                slide[0].scrollIntoView();
            }
        },

        async validCheck() {
            try {
                // if (!this.value.password || this.value.password === '') {
                //     try {
                //         this.$refs.password.focus();
                //     } catch (e) {
                //         this.$emit('stopLoading');
                //         throw new Error("STEP2의 새 프로젝트 만들기에서 Database Password를 입력해 주세요.");
                //     }
                // }

                // if (!this.value.url || this.value.url === '') {
                //     try {
                //         this.$refs.url.focus();
                //     } catch (e) {
                //         this.$emit('stopLoading');
                //         throw new Error("STEP3의 Project URL 연결하기에서 URL을 입력해 주세요.");
                //     }
                // }

                // if (!this.value.secret || this.value.secret === '') {
                //     try {
                //         this.$refs.secret.focus();
                //     } catch (e) {
                //         this.$emit('stopLoading');
                //         throw new Error("STEP3의 Secret API Key 연결에서 Secret을 입력해주세요.");
                //     }
                // }

                // if (!this.value.host || this.value.host === '') {
                //     try {
                //         this.$refs.host.focus();
                //     } catch (e) {
                //         this.$emit('stopLoading');
                //         throw new Error("STEP3의 DataBase 연결에서 Host를 입력해주세요.");
                //     }
                // }

                // if (!this.value.databaseName || this.value.databaseName === '') {
                //     try {
                //         this.$refs.databaseName.focus();
                //     } catch (e) {
                //         this.$emit('stopLoading');
                //         throw new Error("STEP3의 DataBase 연결에서 Database Name을 입력해주세요.");
                //     }
                // }

                // if (!this.value.port || this.value.port === '') {
                //     try {
                //         this.$refs.port.focus();
                //     } catch (e) {
                //         this.$emit('stopLoading');
                //         throw new Error("STEP3의 DataBase 연결에서 Port를 입력해주세요.");
                //     }
                // }

                // if (this.value.port.match(/^[0-9]+$/) === null) {
                //     try {
                //         this.$refs.port.focus();
                //     } catch (e) {
                //         this.$emit('stopLoading');
                //         throw new Error("STEP3의 DataBase 연결에서 Port는 숫자만 입력해주세요.");
                //     }
                // }

                // if (!this.value.user || this.value.user === '') {
                //     try {
                //         this.$refs.user.focus();
                //     } catch (e) {
                //         this.$emit('stopLoading');
                //         throw new Error("STEP3의 DataBase 연결에서 User를 입력해주세요.");
                //     }
                // }

                if (!this.value.id || this.value.id === '' || this.value.id.match(/^[a-zA-Z0-9]+$/) === null) {
                    try {
                        this.$refs.tenantId.focus();
                    } catch (e) {
                        this.$emit('stopLoading');
                        throw new Error("STEP1의 사용할 회사명 입력하기에서 회사 ID를 입력해주세요.");
                    }
                }

                if (this.isEdit === false) {
                    const checkTenantId = await backend.getTenant(this.value.id);
                    if (checkTenantId !== undefined) {
                        try {
                            this.$refs.tenantId.focus();
                        } catch (e) {
                            this.$emit('stopLoading');
                            throw new Error(`STEP1의 사용할 회사명 입력하기에서 '${this.value.id}'는 이미 존재하는 회사 ID입니다. 다른 ID를 사용해주세요.`);
                        }
                    }
                }
            } catch (error) {
                this.$emit('stopLoading');
                throw error; // 에러를 다시 던져서 상위 호출 스택으로 전달합니다.
            }
        },

        copyToClipboard() {
            const textToCopy = getTenantUrl(this.value.id).replace(/^https?:\/\//, '');
            navigator.clipboard.writeText(textToCopy).then(() => {
                this.$emit('showSnackbar', 'Copied to clipboard');
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        },

        filterDomainInput(event) {
            // 영어, 숫자, 하이픈(-)만 허용
            const filtered = event.target.value.replace(/[^a-zA-Z0-9\-]/g, '');
            this.value.id = filtered;
        }
    }
};
</script>

<style>
.active-slide {
    background-color: #f0f0f0; /* Change this to your desired highlight color */
}
.tenant-info-image {
    width:70%;
    margin-top:20px;
}

.tenant-info-text-filed {
    width:70%;
    margin-top:20px;
}

.create-account-img {
    width:35%;
}

@media only screen and (max-width:1280px) {
    .tenant-info-image {
        width:100%;
    }
    .tenant-info-text-filed {
        width:100%;
    }
    .create-account-img {
        width:100%;
    }
}
</style>
