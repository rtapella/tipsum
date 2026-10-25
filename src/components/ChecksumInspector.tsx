import React, { useState } from 'react';
import { Search, HelpCircle, CheckCircle2, XCircle, ArrowRight, Lightbulb } from 'lucide-react';
import { checkChecksum, formatCurrency } from '../utils/checksum';
import { ChecksumVisualizer } from './ChecksumVisualizer';

export const ChecksumInspector: React.FC = () => {
  const [testAmount, setTestAmount] = useState<string>('46.11');

  const parsed = parseFloat(testAmount);
  const result = !isNaN(parsed) && parsed >= 0 ? checkChecksum(parsed) : null;

  // Find nearest valid checksum amounts around the test amount
  const nearbyValids: { total: number; diffCents: number }[] = [];
  if (!isNaN(parsed) && parsed > 0) {
    const baseCents = Math.round(parsed * 100);
    // Find closest 3 below and closest 3 above
    for (let c = baseCents - 20; c <= baseCents + 20; c++) {
      if (c > 0 && c !== baseCents) {
        if (checkChecksum(c / 100).isValid) {
          nearbyValids.push({
            total: c / 100,
            diffCents: c - baseCents,
          });
        }
      }
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-300">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5 text-emerald-400" />
        <h3 className="font-bold text-white text-lg">
          Checksum Total Inspector & Validator
        </h3>
      </div>
      <p className="text-sm text-zinc-400 mb-5">
        Test any total from a receipt or bank statement to check if it satisfies the single-cent checksum rule.
      </p>

      {/* Input */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold font-mono">
            $
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={testAmount}
            onChange={e => setTestAmount(e.target.value)}
            placeholder="e.g. 46.11"
            className="w-full pl-8 pr-4 py-2.5 bg-zinc-950 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white font-mono text-lg transition-colors outline-none"
          />
        </div>

        {/* Quick sample buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-zinc-500 mr-1">Examples:</span>
          {['46.11', '123.40', '52.19', '88.39'].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => setTestAmount(val)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors"
            >
              ${val}
            </button>
          ))}
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="mt-5 space-y-4">
          <ChecksumVisualizer checksum={result} />

          {/* If invalid, show nearest valid options */}
          {!result.isValid && nearbyValids.length > 0 && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
              <span className="text-zinc-400 font-medium block mb-2">
                Nearest valid checksum totals near {formatCurrency(parsed)}:
              </span>
              <div className="flex flex-wrap gap-2">
                {nearbyValids.slice(0, 5).map(item => (
                  <button
                    key={item.total}
                    type="button"
                    onClick={() => setTestAmount(item.total.toFixed(2))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-200 font-mono transition-colors"
                  >
                    <span>{formatCurrency(item.total)}</span>
                    <span
                      className={`text-[10px] ${
                        item.diffCents > 0
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      ({item.diffCents > 0 ? '+' : ''}
                      {item.diffCents}¢)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Why use this checksum explanation */}
      <div className="mt-6 pt-5 border-t border-zinc-800/80">
        <div className="flex items-start gap-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 text-xs leading-relaxed text-zinc-400">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-zinc-200 block mb-1">
              Why use this Checksum on Restaurant Bills?
            </span>
            <p>
              When tipping at restaurants, waitstaff or payment terminal operators manually punch in the tip or total.
              By ensuring the final cent digit equals the sum of all previous digits mod 10 (like <span className="font-mono text-zinc-300">$46.11</span> where <span className="font-mono text-zinc-300">4+6+1=11 → 1</span>),
              any typo or unauthorized change will immediately break the checksum rule on your monthly credit card statement!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
