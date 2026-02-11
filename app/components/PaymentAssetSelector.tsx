import React from 'react';

export type PaymentAssetOption = {
  label: string;
  coinType: string;
  decimals: number;
};

type PaymentAssetSelectorProps = {
  assets: PaymentAssetOption[];
  selectedCoinType: string;
  amount: string;
  onCoinTypeChange: (coinType: string) => void;
  onAmountChange: (amount: string) => void;
  disabled?: boolean;
};

const PaymentAssetSelector: React.FC<PaymentAssetSelectorProps> = ({
  assets,
  selectedCoinType,
  amount,
  onCoinTypeChange,
  onAmountChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-3 border border-[#2D2A26]/10 p-4 bg-[#2D2A26]/[0.02]">
      <p className="text-[9px] tracking-[0.35em] uppercase opacity-50">Payment / 结算</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[9px] tracking-[0.2em] uppercase opacity-60">
          Asset
          <select
            data-testid="payment-asset-select"
            className="h-9 border border-[#2D2A26]/15 bg-[#FAF9F6] px-2 text-[11px] tracking-[0.08em] uppercase outline-none disabled:opacity-60"
            value={selectedCoinType}
            onChange={(e) => onCoinTypeChange(e.target.value)}
            disabled={disabled}
          >
            {assets.map((asset) => (
              <option key={asset.coinType} value={asset.coinType}>
                {asset.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[9px] tracking-[0.2em] uppercase opacity-60">
          Amount
          <input
            data-testid="payment-amount-input"
            className="h-9 border border-[#2D2A26]/15 bg-[#FAF9F6] px-2 text-[11px] tracking-[0.08em] uppercase outline-none disabled:opacity-60"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            inputMode="decimal"
            placeholder="0.1"
            disabled={disabled}
          />
        </label>
      </div>
    </div>
  );
};

export default PaymentAssetSelector;
