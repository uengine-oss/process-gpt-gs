<template>
    <v-card elevation="10">
      <div class="payment-success">
        <div v-if="isLoading">
          <h2>결제 확인중... </h2>
        </div>
        <div v-else-if="!isLoading && !error">
          <v-icon color="green" size="48">mdi-check-circle</v-icon>
          <h2>결제 완료</h2>
        </div>
        <div v-else-if="!isLoading && error">
          <v-icon color="red" size="48" class="red--text">mdi-close-circle</v-icon>
          <h2>결제 실패</h2>
        </div>
        <div v-if="error" class="error">
          <p>결제 확인 중 오류가 발생했습니다.({{ error.status }})</p>
          <div v-if="error.code" style="display: flex; justify-content: space-between; margin-top: 10px;">
            <span>코드</span>
            <span>{{ error.code }}</span>
          </div>
          <div v-if="error.message" style="display: flex; justify-content: space-between;">
            <span>메시지</span>
            <span>{{ error.message }}</span>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
          <span>결제 번호</span>
          <span>{{ paymentKey }}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>주문 번호</span>
          <span>{{ orderId }}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>결제 금액</span>
          <span>₩{{ amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }}</span>
        </div>
        <div v-if="resData">
          <div style="display: flex; justify-content: space-between; margin-top: 20px;">
            <span>구매 상품</span>
            <span>{{ resData.order_name }}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>결제 일시</span>
            <span>{{ resData.approved_at.replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).*/, '$1/$2/$3 $4:$5:$6') }}</span>
          </div>
        </div>
      </div>
    </v-card>
  </template>
  
  <script>
  export default {
    name: 'RequestSuccess',
    data() {
      return {
        paymentType: '',
        paymentKey: '',
        orderId: '',
        amount: '',
        error: null,
        isLoading: false,
        resData: null,
      };
    },
    async mounted() {
      // 1. 쿼리 파라미터 추출
      const urlParams = new URLSearchParams(window.location.search);

      this.paymentType = urlParams.get("paymentType");
      this.paymentKey = urlParams.get("paymentKey");
      this.orderId = urlParams.get("orderId");
      this.amount = urlParams.get("amount");
  
      // 2. 서버에 결제 확인 요청
      try {
        this.isLoading = true
        const response = await fetch("/payments/verify-and-confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payment_type: this.paymentType,
            payment_key: this.paymentKey,
            order_id: this.orderId,
            amount: this.amount,
          }),
        });

        if (!response.ok) {
          try {
            let res = await response.json();
            this.error = {
                'status': res.status,
                'code': typeof res.message == 'object' ? res.message.code : JSON.parse(res.message).code,
                'message': typeof res.message == 'object' ? res.message.message : JSON.parse(res.message).message
            }
          } catch (e) {
            this.error = {
              'status': response.status,
              'code': response.statusText,
              'message': '결제 서비스 확인이 필요합니다. 관리자에게 문의해주세요.'
            }
          }
        } else {
          let res = await response.json();
          this.resData = res.data
        }

        this.isLoading = false
      } catch (e) {
        this.error = e.message;
      }
    },
  };
  </script>
  
  <style scoped>
  .payment-success {
    max-width: 600px;
    margin: 60px auto;
    padding: 32px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    text-align: center;
  }
  .error {
    color: #d32f2f;
    margin-top: 16px;
  }
  </style>