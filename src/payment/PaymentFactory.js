import TossPayment from './TossPayment';

export default class PaymentFactory {
  static create(gateway) {
    return new TossPayment();
  }
}