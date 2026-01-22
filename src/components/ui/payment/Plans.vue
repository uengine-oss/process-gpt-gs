<template>
    <div class="subscription-plans">
        <h2 class="title" style="text-align: center;">더 많은 크레딧을 위해 구독 플랜을 업그레이드하세요</h2>
        <div class="toggle-row">
            <v-switch
              v-model="isYearly"
              color="primary"
              :label="isYearly ? '매월' : '연 단위 (절약하기)'"
              hide-details
              inset
            ></v-switch>
        </div>
        <div v-if="!loading" class="plans-container" style="display: flex; flex-wrap: wrap; gap: 20px;">
            <div  v-for="plan in filteredList" :key="plan.name" :class="['plan-card', { highlight: plan.badge.popular }]" style="flex: 1 1 250px;">
                <div class="plan-header">
                    <!-- 이름  -->
                    <span class="plan-name">{{ plan.name }}</span>
                    <!-- 뱃지  -->
                    <span v-if="plan.badge && plan.badge.beta" class="beta-badge">베타</span>
                    <span v-if="plan.badge && plan.badge.popular" class="popular-badge">인기</span>
                    <span v-if="plan.badge && plan.badge.recommand" class="recommand-badge">추천</span>
                </div>
                <!-- 가격  -->
                <div class="plan-price">
                    <span>₩ {{ plan.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }}</span>
                    <span>/{{ '월' }}</span>
                </div>
               <!-- 설명  -->
                <div class="plan-features" v-if="plan.description">
                    <span>{{ plan.description }}</span>
                </div>

                <!-- 버튼  -->
                <v-btn 
                    block
                    rounded
                    id="payment-request-button"
                    :disabled="checkIfOwnPlan(plan)"
                    :class="[checkIfOwnPlan(plan) ? 'current-btn' : 'upgrade-btn']"
                    @click="upgrade(plan)"
                    >
                    {{ checkIfOwnPlan(plan) ? "현재 플랜" : `${plan.name } 로 업그레이드`}}
                </v-btn>
                <!-- 특징 -->
                <div style="margin-top:20px; width: -webkit-fill-available;">
                    <ul class="plan-features" style="text-align: left;">
                        <li v-for="(value, key) in plan.feature" :key="key">
                            <div v-if="key == 'monthly_credits'">
                                <v-icon color="green">mdi-check</v-icon>
                                매월 {{ value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }}크레딧
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <v-dialog v-model="dialog" width="1200">
            <Payment :order="orderInfo" payBtn="구독하기">
                <template v-slot:terms>
                    구독을 클릭하면 약관에 따라 향후 결제에 대해 Process GPT에서 귀하에게 대금을 청구할 수 있습니다. 언제든지 구독을 취소할 수 있습니다.
                </template>
            </Payment>
        </v-dialog>
    </div>
</template>

<script>
import Payment from '@/components/ui/payment/Payment.vue';
import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export default {
    components: { Payment },
    data() {
        return {
            loading: true,
            plans: [],
            currentPlan: null,
            isYearly: false,
            orderInfo: null,
            dialog: false,
        }
    },
    created() {
       this.init()
    },
    computed: {
        filteredList(){
            return this.plans
                .filter(plan => plan.billingInterval.includes(this.isYearly ? 'yearly' : 'monthly'))
                .sort((a, b) => a.price - b.price);
        },
    },
    methods: {
        init(){
            var me = this
            me.$try({
                action: async () => {
                    me.loading = true;
                    me.plans = await backend.getPlans({
                        orderBy: 'status',
                        startAt: "active",
                        endAt: "active"
                    });
                    me.currentPlan = await backend.getCurrentPlan();
                    me.loading = false                
                },
            });
        },
        upgrade(plan){
            var me = this
            me.$try({
                action: async () => {
                    me.orderInfo = {
                        refId: plan.id,
                        refType: "subscription",
                        name: `Process GPT ${plan.name}`,
                        title: `Process GPT ${plan.name}플랜 구독하기`,
                        billingInterval: plan.billingInterval, 
                        amount: plan.price,
                        customerEmail: localStorage.getItem('email'),
                        customerName: localStorage.getItem('name'),   
                    }
                    me.dialog = true
                }
            });
        },
        checkIfOwnPlan(plan){
            var me = this
            if(!me.currentPlan) return false
            if(plan.type === me.currentPlan.plan.type) {
                return true;
            }
            return false
        },
    }
  }
  </script>
  
  <style scoped>
  .plan-card {
    background: #fff;
    border: 2px solid #eee;
    border-radius: 12px;
    padding: 28px 24px;
    width: 250px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .plan-card.highlight {
    border-color: #3b82f6;
    box-shadow: 0 4px 16px rgba(59,130,246,0.08);
  }
  .plan-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .plan-name {
    font-size: 1.2rem;
    font-weight: bold;
  }
  .popular-badge {
    background: #3b82f6;
    color: #fff;
    border-radius: 8px;
    padding: 2px 8px;
    font-size: 0.9rem;
  }
  .recommand-badge {
    background: #3b82f6;
    color: #fff;
    border-radius: 8px;
    padding: 2px 8px;
    font-size: 0.9rem;
  }
  .plan-price {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 16px;
  }
  .plan-features {
    list-style: none;
    padding: 0;
    margin: 0 0 18px 0;
    font-size: 0.98rem;
  }
  .upgrade-btn {
    background: #3b82f6;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
  }
  .current-plan {
    background: #3b82f6;
    color: #888;
    cursor: pointer;
    font-size: 1rem;
  }
  </style>