export default class PaymentGateway {
    async load() {
        throw new Error('load() must be implemented');
      }
      
    async getWidgets() {
    throw new Error('getWidgets() must be implemented');
    }
    /**
     * 결제 파라미터 생성 (서버에서만 호출)
     * @param {Object} orderInfo - { productId, quantity, userId ... }
     * @returns {Object} 결제창에 전달할 파라미터(토큰 등)
     */
    generateRequestInfo(orderInfo) {
        throw new Error('generateRequestInfo() must be implemented');
    }

    
  }