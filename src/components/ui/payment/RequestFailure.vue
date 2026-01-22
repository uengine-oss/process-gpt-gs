<template>
    <v-card elevation="10">
      <div class="payment-success">
        <div>
            <v-icon color="red" size="48" class="red--text">mdi-close-circle</v-icon>
            <h2>결제 실패 하였습니다.</h2>
        </div>
      </div>
    </v-card>
  </template>
  
  <script>
  export default {
    name: 'RequestFailure',
    data() {
      return {
      
      };
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