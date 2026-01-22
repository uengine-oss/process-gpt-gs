import PaymentGateway from './PaymentGateway';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY;

export default class TossPayment extends PaymentGateway {
    async load() {
        return await loadTossPayments(TOSS_CLIENT_KEY);
    }
    
    async getWidgets() {
        const tossPayments = await this.load();

        return tossPayments.widgets({
            customerKey: ANONYMOUS
        })
    }
    
    createAmount(value) {       
        return {
            value: value,
            currency: "KRW",
        };
    }

    generateRequestInfo(order, paymentMethod){
        return {
            orderId: Math.random().toString(36).substring(2, 12).toUpperCase() + '-' + Math.random().toString(36).substring(2, 12).toUpperCase(),
            refId: order.refId, // 상품 고유번호
            refType: order.refType, // 상품 타입
            orderName: order.name, // 상품명 
            amount: order.amount, // 최종 결제 금액 
            billingInterval: order.billingInterval, // 결제 주기
            customerEmail: order.customerEmail,
            customerName: order.customerName || order.customerEmail,
            method: paymentMethod.code,
            successUrl: window.location.origin + '/request-success',
            failUrl: window.location.origin + '/request-fail'
        }
    }

    createPaymentTableParams(order){
        let orderId = order.orderId || Math.random().toString(36).substring(2, 12).toUpperCase() + '-' + Math.random().toString(36).substring(2, 12).toUpperCase()
        return {
            order_id: orderId,
            order_name: order.orderName,
            amount: order.amount,
            method: order.method,
            user_id: order.customerEmail,
            ref_id: order.refId,
            ref_type: order.refType,
            tenant_id: window.$tenantName,
        }
    }

    createRequestParmas(order){
        let orderId = order.orderId || Math.random().toString(36).substring(2, 12).toUpperCase() + '-' + Math.random().toString(36).substring(2, 12).toUpperCase()
        return {
            orderId: orderId,
            orderName: order.orderName,
            metadata: {
                refId: order.refId,
                refType: order.refType,
            },
            successUrl: order.successUrl,
            failUrl: order.failUrl,
            customerEmail: order.customerEmail,
            customerName: order.customerName
        }
    }
}