import React from 'react';
import { CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { ChecksumResult } from '../utils/checksum';

interface ChecksumVisualizerProps {
  checksum: ChecksumResult;
  compact?: boolean;
}

export const ChecksumVisualizer: React.FC<ChecksumVisualizerProps> = ({
  checksum,
  compact = false,
}) => {
  const {
    isValid,
    totalFormatted,
    digits,
    prefixDigits,
    lastDigit,
    sumOfPrefix,
    expectedLastDigit,
  } = checksum;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-mono">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
            isValid
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
          }`}
        >
          {isValid ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>{isValid ? 'Checksum Valid' : 'Invalid'}</span>
        </span>
        <span className="text-zinc-400">
          ({prefixDigits.join('+')} = {sumOfPrefix} →{' '}
          <strong className="text-emerald-300 font-bold">{expectedLastDigit}</strong>
          {isValid ? ' = ' : ' ≠ '}
          <strong className={isValid ? 'text-emerald-300' : 'text-amber-400'}>
            {lastDigit}
          </strong>
          )
        </span>
      </div>
    );
  }

  // Find decimal point index in formatted string
  const dotIndex = totalFormatted.indexOf('.');

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isValid
          ? 'bg-emerald-950/20 border-emerald-500/30 shadow-lg shadow-emerald-950/20'
          : 'bg-amber-950/20 border-amber-500/30'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400" />
          )}
          <span
            className={`text-sm font-semibold tracking-wide uppercase ${
              isValid ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {isValid ? 'Checksum Verified Match' : 'Checksum Mismatch'}
          </span>
        </div>
        <div className="text-xs text-zinc-400 font-mono">
          Last Cent Rule Check
        </div>
      </div>

      {/* Visual digit breakdown */}
      <div className="flex flex-wrap items-center gap-1.5 font-mono my-2 text-base">
        <div className="flex items-center gap-1 bg-zinc-900/80 px-2.5 py-1.5 rounded-lg border border-zinc-800">
          <span className="text-zinc-500 text-xs mr-1">Digits:</span>
          {digits.map((digit, idx) => {
            const isLast = idx === digits.length - 1;
            const isDecimalDotBefore =
              dotIndex !== -1 && idx === digits.length - 2;

            return (
              <React.Fragment key={idx}>
                {isDecimalDotBefore && (
                  <span className="text-zinc-500 font-bold px-0.5">.</span>
                )}
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-md font-bold text-sm transition-transform ${
                    isLast
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-sm'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                  }`}
                  title={
                    isLast
                      ? `Last cent digit (${digit})`
                      : `Prefix digit ${idx + 1} (${digit})`
                  }
                >
                  {digit}
                </span>
                {!isLast && idx < digits.length - 2 && (
                  <span className="text-zinc-500 text-xs">+</span>
                )}
                {!isLast && idx === digits.length - 2 && (
                  <span className="text-zinc-500 text-xs">+</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Math step explanation */}
      <div className="mt-3 pt-3 border-t border-zinc-800/80 text-xs space-y-1 font-mono">
        <div className="flex items-center justify-between text-zinc-300">
          <span>Sum of rest of digits:</span>
          <span className="text-blue-300 font-bold">
            {prefixDigits.join(' + ')} = {sumOfPrefix}
          </span>
        </div>
        <div className="flex items-center justify-between text-zinc-300">
          <span>Ones-value of sum ({sumOfPrefix} mod 10):</span>
          <span className="text-emerald-400 font-bold">
            {expectedLastDigit}
          </span>
        </div>
        <div className="flex items-center justify-between text-zinc-300">
          <span>Actual last cent digit:</span>
          <span
            className={`font-bold ${
              isValid ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {lastDigit}
          </span>
        </div>
        <div className="mt-2 text-right">
          <span
            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
              isValid
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {isValid
              ? `✓ Match: ${expectedLastDigit} equals ${lastDigit}`
              : `✗ Differs: expected ${expectedLastDigit}, got ${lastDigit}`}
          </span>
        </div>
      </div>
    </div>
  );
};
