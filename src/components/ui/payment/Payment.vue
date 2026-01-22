<template>
    <div class="payment-container">
      <!-- 좌측: 결제 상품 정보 -->
        <div class="payment-summary">
            <div class="product-title">{{ order.title }}</div>

            <div class="main-price">
                <span class="price">KRW ₩{{ order.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }}</span>
                <span class="period">{{period}}</span>
            </div>
      

            <div class="row">
                <div>
                    <span>{{order.name}}</span>
                    <span v-if="period" class="period" style="font-size: small;">{{period}} 청구</span>
                </div>
                <span class="sub-price">KRW ₩{{ order.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }}</span>

            </div>
            <v-divider></v-divider> 
              
            <div class="row" style="margin-top: 20px;">
                <span>소계</span>
                <span class="sub-price">KRW ₩{{ order.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }}</span>
            </div>

             <div class="row">
                <span>세금 <span class="info-icon">ⓘ</span></span>
                <span class="tax-price">KRW ₩0</span>
            </div>
            <div class="total-row">
                <span>당일 지불 총액</span>
                <span class="total-amount">KRW ₩{{ order.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }}</span>
            </div>
        </div>        

  
      <!-- 우측: 결제 폼 -->
      <div class="payment-form">
        <div class="product-title">연락처 정보</div>
        <div class="form-group">
          <label>이메일</label>
          <v-text-field
            v-model="order.customerEmail"
            placeholder="email@example.com"
          ></v-text-field>
        </div>
        
        <div class="form-group">
          <label>결제 방식</label>
            <div :id="paymentMethodId"></div>
            <div :id="agreementId"></div>
        </div>
        <button class="pay-btn" :disabled="!canPay" :id="buttonId"> {{ payBtn }}</button>

        <div class="terms">
          <slot name="terms"></slot>
        </div>
      </div>
    </div>
</template>
  
<script>
import BackendFactory from '@/components/api/BackendFactory';
import PaymentFactory from '@/payment/PaymentFactory';

const backend = BackendFactory.createBackend();
const paymentBackend = PaymentFactory.create();

export default {
    props:{
        payBtn: {
            type: String,
            default: '결제하기'
        },
        order: {
            type: Object,
            required: true,
            default: {
                refId: '', // 상품 고유번호
                refType: '', // 상품 타입
                name: '', // 상품명 
                title: '', // 상품 제목
                billingInterval: null, // null: 일회, monthly: 매월, yearly: 매년
                amount: '', // 최종 결제 금액 
                customerEmail: '',// 고객 이메일
                customerName: ''// 고객 이름
            }
        }
    },
    data() {
      return {
        widgets: null,
        paymentMethodWidget: null,
        paymentMethodId: 'payment-method-' + Math.random().toString(36).substr(2, 9),
        agreementId: 'agreement-' + Math.random().toString(36).substr(2, 9),
        buttonId: 'payment-request-button-' + Math.random().toString(36).substr(2, 9)
      };
    },
    async mounted() {
      // PG사별 위젯 로더 생성
      this.widgets = await paymentBackend.getWidgets();
  
      // 결제 금액 설정
      if (this.widgets.setAmount) {
        await this.widgets.setAmount(paymentBackend.createAmount(this.order.amount));
      }
  
      // 결제 UI 렌더링
      if (this.widgets.renderPaymentMethods) {
        this.paymentMethodWidget = await this.widgets.renderPaymentMethods({
          selector: `#${this.paymentMethodId}`,
          variantKey: "DEFAULT",
        });
      }
      if (this.widgets.renderAgreement) {
        await this.widgets.renderAgreement({
          selector: `#${this.agreementId}`,
          variantKey: "AGREEMENT",
        });
      }
  
      // 결제 요청 버튼 이벤트
      document.getElementById(this.buttonId).addEventListener('click', this.request);
    },
    beforeDestroy() {
      document.getElementById(this.buttonId).removeEventListener('click', this.request);
    },
    computed: {
      canPay() {
        return this.order.customerEmail
      },
      period(){
          if(!this.order.billingInterval) return null;
          return this.order.billingInterval == 'monthly' ? '매월' : '매년'
      },
    },
    methods: {
        async request() {
            var me = this
            me.$try({
                action: async () => {
                  const paymentMethod = await me.paymentMethodWidget.getSelectedPaymentMethod(); 
                  const requestInfo = paymentBackend.generateRequestInfo(me.order, paymentMethod);

                  // 결제 요청 정보 저장
                  await backend.putRequestPayment(paymentBackend.createPaymentTableParams(requestInfo));

                  // 실제 PG 결제 요청
                  await me.widgets.requestPayment(paymentBackend.createRequestParmas(requestInfo));
                },
                // onFail: (err) => {
                  
                //   alert('결제 취소 되었습니다.');
                // }
            });
            
        }
    }
  };
  </script>
  
  <style scoped>
  .payment-container {
    display: flex;
    max-width: 1200px;
    width: 100%;
    margin: 40px auto;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    overflow: hidden;
  }
  .payment-summary {
    flex: 4.5;
    padding: 32px 32px 32px 40px;
    border-right: 1px solid #eee;
    background: #fafbfc;
  }
  .payment-form {
    flex: 5.5;
    padding: 32px 40px 32px 32px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 18px;
  }
  .back {
    font-size: 1.2rem;
    cursor: pointer;
    color: #888;
  }
  .title {
    font-weight: bold;
    font-size: 1.1rem;
  }
  .product-title {
    font-size: 1.0rem;
    font-weight: bold;
    margin-bottom: 12px;
  }
  .main-price {
    font-size: 2.2rem;
    font-weight: bold;
    margin-bottom: 30px;
  }
  .sub-price {
    font-size: 1.0rem;
    font-weight: 200;
  }
  .tax-price {
    font-size: 1.0rem;
    color: #888;
    margin-left: 6px;
  }
  .period {
    font-size: 1.1rem;
    color: #888;
    margin-left: 6px;
  }
  
  .sub-info {
    color: #888;
    font-size: 1rem;
    margin-bottom: 18px;
  }
  .origin-price {
    text-decoration: line-through;
    margin-right: 8px;
  }
  .summary-card {
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.03);
    padding: 16px 18px;
    margin-bottom: 12px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .discount-row {
    background: #e6f7ec;
    border-radius: 6px;
    padding: 6px 10px;
    margin-bottom: 0;
  }
  .discount-badge {
    color: #1db954;
    font-weight: bold;
    font-size: 0.98rem;
  }
  .per-month {
    color: #888;
    font-size: 0.98rem;
  }
  .promo-btn {
    background: #f3f4f6;
    border: none;
    border-radius: 6px;
    padding: 6px 14px;
    font-size: 1rem;
    color: #222;
    margin-bottom: 10px;
    cursor: pointer;
  }
  .info-icon {
    font-size: 0.95rem;
    color: #888;
    margin-left: 2px;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    font-size: 1.1rem;
    margin-top: 18px;
    border-top: 1px solid #eee;
    padding-top: 12px;
  }
  .total-amount {
    font-size: 1.3rem;
    color: #222;
  }
  .payment-form .form-group {
    margin-bottom: 18px;
  }
  .payment-form label {
    font-weight: bold;
    font-size: 1rem;
    margin-bottom: 6px;
    display: block;
  }
  .payment-form input[type="email"] {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    margin-top: 4px;
    margin-bottom: 8px;
  }
  .payment-methods {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .method {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1rem;
    margin-bottom: 4px;
    cursor: pointer;
  }
  .card-icon {
    width: 28px;
    height: 18px;
    object-fit: contain;
    margin-left: 2px;
  }
  .pay-btn {
    width: 100%;
    background: #222;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 14px 0;
    font-size: 1.1rem;
    font-weight: bold;
    margin-top: 10px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .pay-btn:disabled {
    background: #bbb;
    cursor: not-allowed;
  }
  .terms {
    font-size: 0.92rem;
    color: #888;
    margin-top: 8px;
    margin-bottom: 12px;
  }
  .footer {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
    color: #bbb;
    margin-top: 10px;
  }
  .divider {
    color: #ccc;
  }
  a {
    color: #888;
    text-decoration: underline;
    font-size: 0.95rem;
  }
  </style>