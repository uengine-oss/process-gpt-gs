<template>
    <v-menu
        v-if="false"
        location="top"
        offset="8"
        open-on-hover
    >
        <template v-slot:activator="{ props }">
            <div
                class="credit-badge credit-badge-full"
                v-bind="props"
                style="cursor:pointer; margin-bottom:5px;"
            >
                <span class="credit-badge-icon">🔋</span>
                <span class="credit-badge-value">{{ availableCredit }}</span>
                <span class="credit-badge-divider">|</span>
                <a href="/pricing" class="credit-badge-upgrade">구매하기</a>
            </div>
        </template>

        <div class="credit-menu-box" style="min-width:260px;max-width:320px; z-index: 1000;">
            <div class="credit-menu-section">
                <div class="credit-menu-row">
                    <span class="credit-menu-icon">🔋</span>
                    <span class="credit-menu-label">크레딧</span>
                    <span class="credit-menu-value">{{ availableCredit }}</span>
                </div>
            </div>
            <div class="credit-menu-footer">
                <a href="/usage" class="credit-menu-link">사용 현황 보기 <v-icon size="14">mdi-chevron-right</v-icon></a>
            </div>
        </div>
    </v-menu>

    <v-sheet rounded="md" color="lightprimary" class="pa-4  ExtraBox hide-menu">
        <div class="d-flex align-center justify-space-between">
            <v-avatar size="50">
                <v-img :src="picture" width="50" />
            </v-avatar>
            <div>
                <h6 class="text-h6 d-flex align-center font-weight-semibold">{{ name }}</h6>
                <span class="text-subtitle-2 font-weight-medium text-grey100">
                    {{ userRole }}
                </span>
            </div>
            <div>
                <v-tooltip :text="$t('ExtraBox.logOut')">
                    <template v-slot:activator="{ props }">
                        <v-btn icon class="bg-lightprimary" flat  size="small" @click="logout()" v-bind="props">
                            <Icon icon="mdi-logout-variant" class="text-primary" width="20" height="20" />
                        </v-btn>
                    </template>
                </v-tooltip>
            </div>
        </div>
    </v-sheet>
</template>

<script>
import { defineComponent } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { Icon } from '@iconify/vue';
import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default defineComponent({
    name: 'ExtraBox',
    components: {
        Icon
    },
    data() {
        return {
            name: '',
            picture: '',
            isAdmin: false,
            authStore: useAuthStore(),
            showMenu: false,
            credit: undefined
        };
    },
    computed: {
        userRole() {
            return this.isAdmin ? 'Admin' : '';
        },
        availableCredit(){
          if(this.credit == undefined) return '조회중...';
          if(!this.credit) return 0;

          return this.credit.available.toFixed(2);
        }
    },
    async mounted() {
        this.name = localStorage.getItem("userName") || '';
        this.picture = localStorage.getItem("picture") || '';
        this.isAdmin = localStorage.getItem("isAdmin") === 'true';
        this.loadCredit();

        window.addEventListener('localStorageChange', (event) => {
            if (event.detail.key === 'isAdmin') {
                this.isAdmin = event.detail.value === 'true' || event.detail.value === true;
            }
        });

        await backend.watchCreditUsage((callback => {
            this.loadCredit();           
        }));
    },
    methods: {
        logout() {
            this.authStore.logout();
        },
        async loadCredit() {
            this.credit = await backend.getCreditBalance();
        }
    }
});
</script>

<style lang="scss">
.ExtraBox {
    position: relative;
}

.line-height-none {
    line-height: normal;
}
.credit-menu-float {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: 12px;
  z-index: 1000;
}
.credit-box {
    margin-bottom: 5px;
}
.credit-menu-box {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  padding: 20px 20px 12px 20px;
  min-width: 260px;
  max-width: 320px;
  font-family: inherit;
}

.credit-menu-section {
  margin-bottom: 10px;
}
.credit-menu-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 2px;
}
.credit-menu-icon {
  margin-right: 6px;
  color: #888;
  font-size: 18px;
}
.credit-menu-label {
  flex: 1;
  color: #222;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
}
.credit-menu-value {
  color: #222;
  font-size: 17px;
  font-weight: 700;
  margin-left: 8px;
}
.credit-menu-desc {
  color: #888;
  font-size: 13px;
  margin-left: 24px;
  margin-bottom: 2px;
  line-height: 1.3;
}
.credit-menu-footer {
  border-top: 1px solid #f0f0f0;
  margin-top: 10px;
  padding-top: 8px;
  text-align: left;
}
.credit-menu-link {
  color: #3b82f6;
  font-size: 14px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  font-weight: 500;
}
.credit-menu-link:hover {
  text-decoration: underline;
}
.credit-badge {
  display: flex;
  align-items: center;
  border: 1.5px solid #ececec;
  border-radius: 20px;
  background: #fafbfc;
  padding: 4px 16px 4px 10px;
  font-size: 17px;
  font-weight: 500;
  gap: 7px;
}

.credit-badge-full {
  width: 100%;
  justify-content: space-between;
}

.credit-badge-icon {
  font-size: 18px;
  margin-right: 2px;
}
.credit-badge-value {
  color: #222;
  font-weight: 600;
  font-size: 17px;
}
.credit-badge-divider {
  color: #d0d0d0;
  margin: 0 6px;
  font-size: 16px;
}
.credit-badge-upgrade {
  color: #2196f3;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  margin-left: 2px;
  transition: color 0.15s;
  white-space: nowrap;
}
.credit-badge-upgrade:hover {
  color: #1565c0;
  text-decoration: underline;
}
</style>
