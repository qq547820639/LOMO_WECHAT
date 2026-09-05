/**
 * UI-compatible bridge for legacy cash/withdrawal/real-money settlement screens.
 * This delivery intentionally does NOT implement real-money gambling or cash-out execution.
 * Bind these methods only to an authorized, lawful settlement provider after independent review.
 */
export interface SettlementBridge {
  getDisplayBalance(): Promise<{ displayAmount: string }>;
  requestWithdrawalPreview(amount: string): Promise<{ fee: string; arrival: string }>;
}

export class SandboxSettlementBridge implements SettlementBridge {
  async getDisplayBalance() { return { displayAmount: '0.00 (沙盒)' }; }
  async requestWithdrawalPreview(amount: string) { return { fee: '0.00', arrival: `${amount} (不会实际兑付)` }; }
}
