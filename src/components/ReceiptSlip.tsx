import React from 'react';
import { ShieldCheck, Receipt, Copy, Check, Users } from 'lucide-react';
import { formatCurrency, TipTierResult } from '../utils/checksum';

interface ReceiptSlipProps {
  subtotal: number;
  taxAmount: number;
  billToPay: number;
  selectedTier: TipTierResult;
  splitCount: number;
  onSplitChange: (count: number) => void;
  onCopy: (text: string) => void;
  copied: boolean;
}

export const ReceiptSlip: React.FC<ReceiptSlipProps> = ({
  subtotal,
  taxAmount,
  billToPay,
  selectedTier,
  splitCount,
  onSplitChange,
  onCopy,
  copied,
}) => {
  const { tipAmount, finalTotal, effectivePercent, checksum } = selectedTier;
  const perPersonTotal = splitCount > 1 ? finalTotal / splitCount : finalTotal;
  const perPersonTip = splitCount > 1 ? tipAmount / splitCount : tipAmount;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const fullReceiptText = `
--- RECEIPT SUMMARY ---
Date: ${dateStr} ${timeStr}
Subtotal: ${formatCurrency(subtotal)}
Tax: ${formatCurrency(taxAmount)}
Base Total: ${formatCurrency(billToPay)}
Tip (${effectivePercent.toFixed(1)}%): ${formatCurrency(tipAmount)}
-------------------------
TOTAL: ${formatCurrency(finalTotal)}
Checksum: ${checksum.formulaString}
-------------------------
`.trim();

  return (
    <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl overflow-hidden text-zinc-300">
      {/* Receipt header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-white tracking-wide text-sm uppercase">
            Receipt Preview & Signature Slip
          </span>
        </div>
        <button
          type="button"
          onClick={() => onCopy(fullReceiptText)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied Slip</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Full Slip</span>
            </>
          )}
        </button>
      </div>

      {/* Realistic Receipt Paper Layout */}
      <div className="mt-5 bg-zinc-950 p-5 rounded-xl border border-zinc-800/80 font-mono text-sm relative">
        {/* Subtle decorative receipt cutouts */}
        <div className="text-center pb-3 border-b border-dashed border-zinc-800 space-y-0.5">
          <p className="font-bold text-white tracking-wider text-base">
            MERCHANT COPY
          </p>
          <p className="text-xs text-zinc-500">
            {dateStr} • {timeStr}
          </p>
          <p className="text-[11px] text-zinc-600">TABLE 04 • GUEST 1</p>
        </div>

        {/* Itemized charges */}
        <div className="py-3 border-b border-dashed border-zinc-800 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-400">Pre-Tax Subtotal</span>
            <span className="text-zinc-200 font-semibold">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Sales Tax</span>
            <span className="text-zinc-200">{formatCurrency(taxAmount)}</span>
          </div>

          <div className="flex justify-between text-zinc-400">
            <span>Bill with Tax</span>
            <span>{formatCurrency(billToPay)}</span>
          </div>
        </div>

        {/* Tip & Total Section formatted as on card slip */}
        <div className="py-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-zinc-200">TIP:</span>
              <span className="text-xs text-emerald-400 font-semibold">
                ({effectivePercent.toFixed(1)}%)
              </span>
            </div>
            <span className="font-bold text-emerald-400 text-base">
              {formatCurrency(tipAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-700 text-base">
            <span className="font-black text-white tracking-wide">TOTAL:</span>
            <span className="font-black text-xl text-white">
              {formatCurrency(finalTotal)}
            </span>
          </div>
        </div>

        {/* Checksum verification watermark */}
        <div className="mt-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Checksum Verified</span>
          </div>
          <span className="text-emerald-300 font-mono text-[11px]">
            {checksum.sumOfPrefix} mod 10 = {checksum.expectedLastDigit} ≡ .{checksum.lastDigit}¢
          </span>
        </div>

        {/* Simulated Signature Line */}
        <div className="mt-6 pt-4 border-t border-dashed border-zinc-800">
          <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-3">
            X ________________________________________
          </div>
          <p className="text-[10px] text-zinc-600 text-center uppercase tracking-wider">
            I AGREE TO PAY ABOVE TOTAL AMOUNT ACCORDING TO CARD ISSUER AGREEMENT
          </p>
        </div>
      </div>

      {/* Bill Splitting Options */}
      <div className="mt-5 pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-zinc-400" />
          <span className="text-xs text-zinc-300 font-medium">Split Bill:</span>
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            {[1, 2, 3, 4, 5, 6].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => onSplitChange(num)}
                className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                  splitCount === num
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {num === 1 ? '1' : `${num}`}
              </button>
            ))}
          </div>
        </div>

        {splitCount > 1 && (
          <div className="text-right">
            <span className="text-xs text-zinc-400 block">
              Each ({splitCount} people)
            </span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {formatCurrency(perPersonTotal)}
            </span>
            <span className="text-[10px] text-zinc-500 block">
              (incl. {formatCurrency(perPersonTip)} tip each)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
