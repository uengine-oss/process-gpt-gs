<template>
      <v-card elevation="10">
        <div class="pa-4" :class="this.globalIsMobile.value ? 'todolist-card-box-is-mobile' : 'todolist-card-box'">
            <div class="subscription-plans">
                <h2 class="title" style="text-align: center; margin-bottom: 50px;">AI 기반 프로세스 관리부터 실행까지, 손쉽게 시작하세요</h2>

                <div v-if="!loading" class="plans-container" style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 50px;">
                    <div  v-for="credit in filteredList" :key="credit.name" :class="['plan-card', { highlight: credit.badge.popular }]" style="flex: 1 1 250px;">
                        <!-- <div class="plan-header" v-if="false">
                            <span class="plan-name">{{ credit.name }}</span>
                            <span v-if="credit.badge && credit.badge.beta" class="beta-badge">베타</span>
                            <span v-if="credit.badge && credit.badge.popular" class="popular-badge">인기</span>
                            <span v-if="credit.badge && credit.badge.recommand" class="recommand-badge">추천</span>
                        </div> -->
                        <!-- 가격  -->
                        <div class="plan-price">
                            <span v-if="credit.badge && credit.badge.popular" class="popular-badge">인기</span>
                            <span v-if="credit.badge && credit.badge.recommand" class="recommand-badge">추천</span>
                            <div v-if="credit.discountRate > 0" class="price-with-discount">
                                <div class="price-row">
                                    <span class="original-price">₩ {{ credit.originalPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }}</span>
                                    <span class="discount-badge-price">{{ credit.discountRate }}% 할인</span>
                                </div>
                                <span class="final-price">₩ {{ credit.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }}</span>
                            </div>
                            <div v-else class="price-normal">
                                <span>₩ {{ credit.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }}</span>
                            </div>
                        </div>
                        <!-- 설명  -->
                        <div class="plan-features" v-if="credit.description">
                            <span>{{ credit.description }}</span>
                        </div>

                        <!-- 버튼  -->
                        <v-btn 
                            block
                            rounded
                            id="payment-request-button"
                            :class="'upgrade-btn'"
                            @click="upgrade(credit)"
                            >
                            구매하기
                        </v-btn>
                        <!-- 특징 -->
                        <div style="margin-top:20px; width: -webkit-fill-available;">
                            <ul class="plan-features" style="text-align: left;">
                                <div>
                                    <v-icon color="green">mdi-check</v-icon>
                                    {{ credit.credit.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }}🔋 제공
                                </div>
                                <div v-for="(item,key) in currentServiceList" :key="key">
                                    <div class="service-item">
                                        <v-icon color="green">mdi-check</v-icon>                                    
                                        <span class="service-name">{{ item['service_name'] || '로딩 중...' }}</span>
                                        <v-tooltip location="top">
                                            <template v-slot:activator="{ props }">
                                                <v-icon 
                                                v-bind="props"
                                                size="small" 
                                                color="grey" 
                                                class="info-icon"
                                                >
                                                mdi-help-circle-outline
                                                </v-icon>
                                            </template>
                                            <div v-html="getServiceTooltipHtml(item)" />
                                        </v-tooltip>
                                    </div>
                                </div>
                            </ul>
                        </div>
                    </div>
                </div>

                <v-dialog v-model="dialog" width="1200">
                    <Payment :order="orderInfo" payBtn="구매하기">
                        <template v-slot:terms></template>
                    </Payment>
                </v-dialog>
            </div>
        </div>
    </v-card>
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
            list: [],
            currentServiceList: null,

            orderInfo: null,
            dialog: false,
        }
    },
    created() {
       this.init()
    },
    computed: {
        filteredList() {
            if (!this.list || this.list.length === 0) return [];
            
            // 기준 상품 (가장 저렴한 상품)
            const baseProduct = this.list.reduce((min, current) => 
                current.price < min.price ? current : min
            );
            
            return this.list
                .sort((a, b) => a.price - b.price)
                .map(credit => {
                    if (credit.id === baseProduct.id) {
                        return {
                            ...credit,
                            discountRate: 0,
                            originalPrice: credit.price,
                            pricePerCredit: credit.price / credit.credit
                        };
                    }
                    
                    // 크레딧 비율 계산
                    const creditRatio = credit.credit / baseProduct.credit;
                    // 기준 가격 × 크레딧 비율
                    const expectedPrice = baseProduct.price * creditRatio;
                    // 할인율 계산
                    const discountRate = ((expectedPrice - credit.price) / expectedPrice * 100).toFixed(1);
                    
                    return {
                        ...credit,
                        discountRate,
                        originalPrice: Math.round(expectedPrice),
                        pricePerCredit: credit.price / credit.credit
                    };
                });
        },
    },
    methods: {
        init(){
            var me = this
            me.$try({
                action: async () => {
                    me.loading = true;

                    me.list = await backend.getCredits({
                        orderBy: 'status',
                        startAt: "active",
                        endAt: "active"
                    });
                    let list = await backend.getCurrentServiceCatalog()
                    me.currentServiceList = me.generateServiceList(list)
                    
                    me.loading = false                
                },
            });
        },
        upgrade(credit){
            var me = this
            me.$try({
                action: async () => {
                    me.orderInfo = {
                        refId: credit.id,
                        refType: credit.type,
                        name: `Process GPT ${credit.credit}`,
                        title: `Process GPT ${credit.credit} 구매하기`,
                        billingInterval: null, 
                        amount: credit.price,
                        customerEmail: localStorage.getItem('email'),
                        customerName: localStorage.getItem('userName')
                    }
                    me.dialog = true
                }
            });
        },
        generateServiceList(list) {
            const serviceMap = {};

            list.forEach(item => {
                if (!serviceMap[item.service_id]) {
                    serviceMap[item.service_id] = {
                        service_id: item.service_id,
                        service_name: item.service_name,
                        available_from: item.available_from,
                        detail: {}
                    };
                }
                serviceMap[item.service_id].detail[item.model] = item.dimension;
            });

            return Object.values(serviceMap);
        },
        getServiceTooltipHtml(service) {
            if (!service || !service.detail) return '가격 정보 없음';
            return Object.entries(service.detail)
                    .map(([model, details]) => {
                        const detailEntries = Object.entries(details)
                            .map(([type, info]) => `${type}: ${info.creditPerUnit}/${info.unit}`)
                            .join('<br>');
                        return `${model}<br>${detailEntries}`;
                    }).join('<br><br>');
        }
    }
  }
  </script>
  
  <style scoped>
  .plan-card {
    background: #f5f5f5;
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
    height: 128px;
    align-content: end;
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 16px;
  }
  
  .price-with-discount {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  
  .price-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .original-price {
    font-size: 1.2rem;
    color: #888;
    text-decoration: line-through;
    font-weight: normal;
  }
  
  .discount-badge-price {
    background: #ff4757;
    color: white;
    border-radius: 8px;
    padding: 2px 8px;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .final-price {
    font-size: 2rem;
    font-weight: bold;
    color: #000;
  }
  
  .price-normal {
    display: flex;
    align-items: center;
    justify-content: center;
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
    max-height: 40px;
  }
  .current-plan {
    background: #3b82f6;
    color: #888;
    cursor: pointer;
    font-size: 1rem;
  }

.discount-badge {
  background: #ff4757;
  color: white;
  border-radius: 8px;
  padding: 2px 8px;
  font-size: 0.9rem;
  margin-left: 4px;
}

.best-value-badge {
  background: #2ed573;
  color: white;
  border-radius: 8px;
  padding: 2px 8px;
  font-size: 0.9rem;
  margin-left: 4px;
}

.credit-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
}

.price-per-credit {
  color: #888;
  font-size: 0.9rem;
  margin-top: 4px;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.service-name {
  flex: 1;
}

.info-icon {
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.info-icon:hover {
  opacity: 1;
}
  </style>