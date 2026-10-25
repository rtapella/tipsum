import React from 'react';
import { Copy, Check, ChevronRight, ShieldCheck } from 'lucide-react';
import { TipTierResult, formatCurrency } from '../utils/checksum';

interface TipTierCardProps {
  result: TipTierResult;
  subtotal: number;
  billToPay: number;
  isSelected: boolean;
  onSelect: () => void;
  onCopy: (text: string) => void;
  copied: boolean;
}

export const TipTierCard: React.FC<TipTierCardProps> = ({
  result,
  subtotal,
  isSelected,
  onSelect,
  onCopy,
  copied,
}) => {
  const {
    targetPercent,
    tipAmount,
    finalTotal,
    effectivePercent,
    centsOverExact,
    checksum,
  } = result;

  const copyText = `Tip: ${formatCurrency(tipAmount)} (${effectivePercent.toFixed(1)}%) | Total: ${formatCurrency(finalTotal)}`;

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(copyText);
  };

  return (
    <div
      onClick={onSelect}
      className={`relative group rounded-lg sm:rounded-2xl p-2.5 sm:p-4 cursor-pointer transition-all duration-200 border text-left ${
        isSelected
          ? 'bg-zinc-900/95 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
          : 'bg-zinc-900/50 hover:bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
      }`}
    >

      {/* Header: Target % and Effective % */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {targetPercent}%
            </span>
            <span className="text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Just Over
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">
            <span className="text-zinc-200 font-semibold">{effectivePercent.toFixed(1)}%</span>
            {centsOverExact > 0 && (
              <span className="text-zinc-500 ml-1 hidden sm:inline">
                (+${(centsOverExact / 100).toFixed(2)})
              </span>
            )}
          </p>
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopyClick}
          aria-label="Copy tip and total"
          className="p-1.5 sm:p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors shrink-0"
          title="Copy tip & total"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Main Amounts: Stacked on mobile, 2-cols on larger screens */}
      <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-zinc-800/80 space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-2">
        <div className="bg-zinc-950/60 rounded-lg p-2 sm:p-2.5 border border-zinc-800/50 flex sm:flex-col justify-between sm:justify-start items-center sm:items-start">
          <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Tip
          </span>
          <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
            {formatCurrency(tipAmount)}
          </span>
        </div>

        <div className="bg-zinc-950/60 rounded-lg p-2 sm:p-2.5 border border-zinc-800/50 flex sm:flex-col justify-between sm:justify-start items-center sm:items-start">
          <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Total
          </span>
          <span className="text-base sm:text-lg font-bold text-white font-mono">
            {formatCurrency(finalTotal)}
          </span>
        </div>
      </div>

      {/* Micro Checksum breakdown banner */}
      <div className="mt-2 sm:mt-2.5 bg-zinc-950/70 rounded-md sm:rounded-lg px-2 sm:px-2.5 py-1.5 border border-zinc-800/70 flex items-center justify-between text-[10px] sm:text-[11px] font-mono">
        <div className="flex items-center gap-1 text-zinc-300 truncate">
          <span className="text-zinc-400 font-bold">{checksum.sumOfPrefix}</span>
          <span className="text-zinc-600">→</span>
          <span className="text-emerald-400 font-bold">{checksum.expectedLastDigit}</span>
          <span className="text-emerald-400">==</span>
          <span className="text-emerald-400 font-bold">.{checksum.lastDigit}¢</span>
        </div>
        <ChevronRight
          className={`w-3.5 h-3.5 text-zinc-500 shrink-0 transition-transform ${
            isSelected ? 'rotate-90 text-emerald-400' : 'group-hover:translate-x-0.5'
          }`}
        />
      </div>
    </div>
  );
};
