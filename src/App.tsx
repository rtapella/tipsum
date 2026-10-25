/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  ShieldCheck,
  DollarSign,
  Check,
  Clock,
  Trash2,
  Info,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  calculateChecksumTip,
  calculateAllStandardTiers,
  formatCurrency,
  TipTierResult,
  TipMode,
} from './utils/checksum';
import { TipTierCard } from './components/TipTierCard';
import { ChecksumVisualizer } from './components/ChecksumVisualizer';
import { ReceiptSlip } from './components/ReceiptSlip';
import { ChecksumInspector } from './components/ChecksumInspector';

type InputMode = 'subtotal-tax' | 'bill-tax';

interface SavedBill {
  id: string;
  timestamp: number;
  subtotal: number;
  tax: number;
  billToPay: number;
  tipPercent: number;
  tipAmount: number;
  finalTotal: number;
}

export default function App() {
  // Input states
  const [inputMode, setInputMode] = useState<InputMode>('subtotal-tax');
  const [subtotalInput, setSubtotalInput] = useState<string>('40.00');
  const [billInput, setBillInput] = useState<string>('43.50');
  const [taxInput, setTaxInput] = useState<string>('3.50');
  const [taxType, setTaxType] = useState<'dollar' | 'percent'>('dollar');
  const [taxPercent, setTaxPercent] = useState<string>('8.75');

  // Strategy & Custom Tip
  const [tipStrategy, setTipStrategy] = useState<TipMode>('just-over');
  const [customPercent, setCustomPercent] = useState<number>(18);
  const [selectedPercent, setSelectedPercent] = useState<number>(20);
  const [splitCount, setSplitCount] = useState<number>(1);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'calculator' | 'inspector' | 'history'>('calculator');

  // Copy feedback state
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Saved bills history
  const [savedHistory, setSavedHistory] = useState<SavedBill[]>(() => {
    try {
      const stored = localStorage.getItem('tipsum_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Calculate actual numbers based on input mode
  const { subtotal, taxAmount, billToPay } = useMemo(() => {
    let sub = 0;
    let tax = 0;
    let bill = 0;

    if (inputMode === 'subtotal-tax') {
      sub = parseFloat(subtotalInput) || 0;
      if (taxType === 'dollar') {
        tax = parseFloat(taxInput) || 0;
      } else {
        const pct = parseFloat(taxPercent) || 0;
        tax = (sub * pct) / 100;
      }
      bill = sub + tax;
    } else {
      // Bill & Tax mode: calculates pre-tax subtotal
      bill = parseFloat(billInput) || 0;
      if (taxType === 'dollar') {
        tax = parseFloat(taxInput) || 0;
        sub = Math.max(0, bill - tax);
      } else {
        const pct = parseFloat(taxPercent) || 0;
        // bill = sub * (1 + pct/100) -> sub = bill / (1 + pct/100)
        sub = pct > 0 ? bill / (1 + pct / 100) : bill;
        tax = Math.max(0, bill - sub);
      }
    }

    return {
      subtotal: Math.max(0, sub),
      taxAmount: Math.max(0, tax),
      billToPay: Math.max(0, bill),
    };
  }, [inputMode, subtotalInput, billInput, taxInput, taxType, taxPercent]);

  // Standard tiers (10%, 15%, 20%, 25%)
  const standardTiers = useMemo(() => {
    return calculateAllStandardTiers(subtotal, billToPay, tipStrategy);
  }, [subtotal, billToPay, tipStrategy]);

  // Custom tier calculation
  const customTier = useMemo(() => {
    return calculateChecksumTip(subtotal, billToPay, customPercent, tipStrategy);
  }, [subtotal, billToPay, customPercent, tipStrategy]);

  // All tiers list (for selection)
  const allTiers = useMemo(() => {
    const list = [...standardTiers];
    if (![10, 15, 20, 25].includes(customPercent)) {
      list.push(customTier);
    }
    return list;
  }, [standardTiers, customTier, customPercent]);

  // Currently selected tier
  const activeSelectedTier = useMemo(() => {
    const found = allTiers.find(t => t.targetPercent === selectedPercent);
    return found || standardTiers[2]; // default 20%
  }, [allTiers, selectedPercent, standardTiers]);

  // Handle copy to clipboard
  const handleCopy = (text: string, key?: string) => {
    navigator.clipboard.writeText(text);
    if (key) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
    setCopyToast(`Copied: ${text}`);
    setTimeout(() => setCopyToast(null), 3000);
  };

  // Save current bill to history
  const handleSaveBill = () => {
    const newEntry: SavedBill = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      subtotal,
      tax: taxAmount,
      billToPay,
      tipPercent: activeSelectedTier.targetPercent,
      tipAmount: activeSelectedTier.tipAmount,
      finalTotal: activeSelectedTier.finalTotal,
    };
    const updated = [newEntry, ...savedHistory.slice(0, 24)];
    setSavedHistory(updated);
    try {
      localStorage.setItem('tipsum_history', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setCopyToast('Saved bill to recent history!');
    setTimeout(() => setCopyToast(null), 2500);
  };

  const handleClearHistory = () => {
    setSavedHistory([]);
    try {
      localStorage.removeItem('tipsum_history');
    } catch {
      // ignore
    }
  };

  // Quick subtotal presets for desktop view
  const setQuickSubtotal = (amount: number) => {
    setSubtotalInput(amount.toFixed(2));
    if (inputMode === 'bill-tax') {
      const calculatedBill = amount + (parseFloat(taxInput) || 0);
      setBillInput(calculatedBill.toFixed(2));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-zinc-950 font-semibold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-sm transition-all animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Header: On mobile, simplified to just calculator / inspector / history; On desktop, includes branding */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-2 sm:px-6 py-2 flex items-center justify-between">
          {/* Desktop Branding: Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-zinc-950 shadow-md">
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white flex items-center gap-1.5">
                TipSum
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  Checksum
                </span>
              </span>
            </div>
          </div>

          {/* Navigation Tabs: Full width on mobile, right-aligned on desktop */}
          <nav className="flex items-center w-full md:w-auto justify-between bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={`flex-1 md:flex-initial px-3 py-1.5 text-center rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'calculator'
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculator</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inspector')}
              className={`flex-1 md:flex-initial px-3 py-1.5 text-center rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'inspector'
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Inspector</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 md:flex-initial px-3 py-1.5 text-center rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>History</span>
              {savedHistory.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
                  {savedHistory.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area: 8px (px-2) mobile margin so cards reach right near the edge */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-2 sm:px-6 py-2.5 sm:py-6 space-y-3 sm:space-y-6">
        {activeTab === 'inspector' ? (
          <ChecksumInspector />
        ) : activeTab === 'history' ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-lg">
                  Saved Checksum Receipts
                </h3>
              </div>
              {savedHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-rose-900 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              )}
            </div>

            {savedHistory.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                No saved bills yet. Calculate a bill and tap "Save Receipt" to keep it here for cross-checking your bank statement!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedHistory.map(item => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs space-y-2 relative"
                  >
                    <div className="flex justify-between text-zinc-500 text-[11px]">
                      <span>
                        {new Date(item.timestamp).toLocaleDateString()} at{' '}
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        {item.tipPercent}% Tip
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-300 pt-1 border-t border-zinc-900">
                      <span>Pre-Tax Subtotal:</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Tax:</span>
                      <span>{formatCurrency(item.tax)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Tip:</span>
                      <span>{formatCurrency(item.tipAmount)}</span>
                    </div>
                    <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-zinc-800">
                      <span>TOTAL:</span>
                      <span>{formatCurrency(item.finalTotal)}</span>
                    </div>
                    <div className="pt-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSubtotalInput(item.subtotal.toFixed(2));
                          setTaxInput(item.tax.toFixed(2));
                          setSelectedPercent(item.tipPercent);
                          setInputMode('subtotal-tax');
                          setActiveTab('calculator');
                        }}
                        className="text-[11px] text-emerald-400 hover:underline"
                      >
                        Load into Calculator →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Calculator Main View */
          <div className="space-y-4 sm:space-y-6">
            {/* Top Prompt Banner: Desktop only (hidden on mobile) */}
            <div className="hidden md:flex bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-2xl p-4 flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    Single-Cent Checksum Rule Active
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      e.g. $46.11
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                    Tips are calculated just over the target percentage so that the total's last cent digit equals the sum of the preceding digits mod 10 (<span className="font-mono text-emerald-300">4+6+1 = 11 → 1 == ._1¢</span>).
                  </p>
                </div>
              </div>
            </div>

            {/* Input Form Card - High-density on mobile, spacious on desktop */}
            <section className="bg-zinc-900/80 border border-zinc-800 rounded-lg sm:rounded-2xl p-2.5 sm:p-5 shadow-lg w-full">
              <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Bill Inputs</span>
                </div>

                {/* Input Mode Toggle */}
                <div className="inline-flex items-center p-0.5 bg-zinc-950 rounded-lg border border-zinc-800 text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => setInputMode('subtotal-tax')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      inputMode === 'subtotal-tax'
                        ? 'bg-emerald-500 text-zinc-950 font-bold shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Subtotal + Tax
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('bill-tax')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      inputMode === 'bill-tax'
                        ? 'bg-emerald-500 text-zinc-950 font-bold shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Total Bill + Tax
                  </button>
                </div>
              </div>

              {/* Input Fields: 2 Columns on mobile */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {/* Field 1: Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs font-bold text-zinc-300 uppercase tracking-wider block truncate">
                    {inputMode === 'subtotal-tax' ? 'Pre-Tax Subtotal' : 'Total on Receipt'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold font-mono text-base">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={inputMode === 'subtotal-tax' ? subtotalInput : billInput}
                      onChange={e => {
                        if (inputMode === 'subtotal-tax') {
                          setSubtotalInput(e.target.value);
                        } else {
                          setBillInput(e.target.value);
                        }
                      }}
                      placeholder="0.00"
                      className="w-full pl-6 pr-2.5 py-2 sm:py-2.5 bg-zinc-950 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg sm:rounded-xl text-white font-mono text-base sm:text-lg transition-colors outline-none"
                    />
                  </div>

                  {/* Quick Preset Buttons: Desktop only (hidden on mobile) */}
                  <div className="hidden md:flex items-center gap-1.5 pt-1.5">
                    <span className="text-[11px] text-zinc-500">Presets:</span>
                    {[25, 40, 50, 75, 100].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setQuickSubtotal(amt)}
                        className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors"
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field 2: Sales Tax */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] sm:text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Tax
                    </label>
                    <div className="flex items-center gap-0.5 bg-zinc-950 px-1 py-0.5 rounded border border-zinc-800 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setTaxType('dollar')}
                        className={`px-1 py-0.2 rounded ${
                          taxType === 'dollar'
                            ? 'bg-zinc-700 text-white font-bold'
                            : 'text-zinc-500'
                        }`}
                      >
                        $
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaxType('percent')}
                        className={`px-1 py-0.2 rounded ${
                          taxType === 'percent'
                            ? 'bg-zinc-700 text-white font-bold'
                            : 'text-zinc-500'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold font-mono text-base">
                      {taxType === 'dollar' ? '$' : '%'}
                    </span>
                    <input
                      type="number"
                      step={taxType === 'dollar' ? '0.01' : '0.1'}
                      min="0"
                      value={taxType === 'dollar' ? taxInput : taxPercent}
                      onChange={e => {
                        if (taxType === 'dollar') {
                          setTaxInput(e.target.value);
                        } else {
                          setTaxPercent(e.target.value);
                        }
                      }}
                      placeholder="0.00"
                      className="w-full pl-6 pr-2.5 py-2 sm:py-2.5 bg-zinc-950 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg sm:rounded-xl text-white font-mono text-base sm:text-lg transition-colors outline-none"
                    />
                  </div>

                  {/* Common Tax presets: Desktop only (hidden on mobile) */}
                  <div className="hidden md:flex items-center gap-1.5 pt-1.5">
                    <span className="text-[11px] text-zinc-500">Rates:</span>
                    {[0, 6, 7.25, 8.875, 10].map(rate => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => {
                          setTaxType('percent');
                          setTaxPercent(rate.toString());
                        }}
                        className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors"
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Retained Calculated Breakdown Strip (Mobile and Desktop) */}
              <div className="mt-2.5 pt-2 border-t border-zinc-800/80 grid grid-cols-3 gap-1.5 sm:gap-3 bg-zinc-950/70 p-2 sm:p-2.5 rounded-lg border border-zinc-800/60 font-mono text-center">
                <div>
                  <span className="text-[9px] sm:text-[10px] text-zinc-400 block uppercase">
                    Pre-Tax Subtotal
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] sm:text-[10px] text-zinc-400 block uppercase">
                    Tax
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-zinc-300">
                    {formatCurrency(taxAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] sm:text-[10px] text-zinc-400 block uppercase">
                    Base Bill
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-400">
                    {formatCurrency(billToPay)}
                  </span>
                </div>
              </div>

              {/* Checksum Rule Fit & Custom Tip: Desktop only (hidden on mobile) */}
              <div className="hidden md:flex mt-3.5 pt-3.5 border-t border-zinc-800 items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Checksum Rule Fit:
                  </span>
                  <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                    {(
                      [
                        { id: 'just-over', label: 'Just Over (Default)' },
                        { id: 'closest', label: 'Closest (± cents)' },
                        { id: 'round-dollar', label: 'Whole Dollar .00' },
                      ] as const
                    ).map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTipStrategy(item.id)}
                        className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                          tipStrategy === item.id
                            ? 'bg-emerald-500 text-zinc-950 font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Tip Input */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Custom Tip:</span>
                  <div className="relative w-20">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={customPercent}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          setCustomPercent(val);
                          setSelectedPercent(val);
                        }
                      }}
                      className="w-full pl-2 pr-6 py-1 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono text-xs text-right outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">
                      %
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* PRE-COMPUTED TIP OUTPUTS (10%, 15%, 20%, 25%) */}
            <section className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5">
                    Pre-Computed Checksum Tips
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Just over target percentage on {formatCurrency(subtotal)} subtotal
                  </p>
                </div>
                <span className="text-[10px] text-zinc-500 hidden sm:block">
                  Tap to view receipt slip below
                </span>
              </div>

              {/* Grid of Tip Cards: 2x2 on mobile, 4 columns on desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                {standardTiers.map(tier => (
                  <TipTierCard
                    key={tier.targetPercent}
                    result={tier}
                    subtotal={subtotal}
                    billToPay={billToPay}
                    isSelected={selectedPercent === tier.targetPercent}
                    onSelect={() => setSelectedPercent(tier.targetPercent)}
                    onCopy={text => handleCopy(text, `tier-${tier.targetPercent}`)}
                    copied={copiedKey === `tier-${tier.targetPercent}`}
                  />
                ))}
              </div>

              {/* Custom Tip Tier: Desktop only (hidden on mobile) */}
              {![10, 15, 20, 25].includes(customPercent) && (
                <div className="hidden md:block mt-3 pt-3 border-t border-zinc-800">
                  <span className="text-xs text-zinc-400 block mb-2 font-medium">
                    Custom {customPercent}% Checksum Calculation:
                  </span>
                  <div className="max-w-xs">
                    <TipTierCard
                      result={customTier}
                      subtotal={subtotal}
                      billToPay={billToPay}
                      isSelected={selectedPercent === customPercent}
                      onSelect={() => setSelectedPercent(customPercent)}
                      onCopy={text => handleCopy(text, `custom-${customPercent}`)}
                      copied={copiedKey === `custom-${customPercent}`}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* SELECTED TIER DEEP DIVE: Visualizer + Receipt Card */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Detailed Step-by-Step Checksum Breakdown (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        Selected Checksum Proof: {formatCurrency(activeSelectedTier.finalTotal)}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Verification of the {activeSelectedTier.targetPercent}% tier tip of {formatCurrency(activeSelectedTier.tipAmount)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveBill}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors shadow-sm"
                    >
                      Save Receipt
                    </button>
                  </div>

                  {/* Visualizer */}
                  <ChecksumVisualizer checksum={activeSelectedTier.checksum} />

                  {/* Quick math summary cards */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
                      <span className="text-[10px] text-zinc-400 uppercase font-medium block">
                        Exact {activeSelectedTier.targetPercent}%
                      </span>
                      <span className="text-sm font-bold font-mono text-zinc-300">
                        {formatCurrency(activeSelectedTier.exactTargetTip)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
                      <span className="text-[10px] text-zinc-400 uppercase font-medium block">
                        Checksum Tip
                      </span>
                      <span className="text-sm font-bold font-mono text-emerald-400">
                        {formatCurrency(activeSelectedTier.tipAmount)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
                      <span className="text-[10px] text-zinc-400 uppercase font-medium block">
                        Added Cent Diff
                      </span>
                      <span className="text-sm font-bold font-mono text-blue-300">
                        +{activeSelectedTier.centsOverExact}¢
                      </span>
                    </div>
                  </div>

                  {/* Explanatory callout */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/70 text-xs text-zinc-400 leading-relaxed flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p>
                      Because the last cent digit steps cyclically, finding a checksum-conforming total only requires adjusting the tip upward by a small fraction (here,{' '}
                      <strong className="text-zinc-200">
                        +{activeSelectedTier.centsOverExact} cents
                      </strong>
                      ), giving an effective tip of{' '}
                      <strong className="text-emerald-300">
                        {activeSelectedTier.effectivePercent.toFixed(2)}%
                      </strong>
                      .
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Receipt Slip & Signature Preview (5 cols) */}
              <div className="lg:col-span-5">
                <ReceiptSlip
                  subtotal={subtotal}
                  taxAmount={taxAmount}
                  billToPay={billToPay}
                  selectedTier={activeSelectedTier}
                  splitCount={splitCount}
                  onSplitChange={setSplitCount}
                  onCopy={text => handleCopy(text, 'slip')}
                  copied={copiedKey === 'slip'}
                />
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800/80 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            TipSum • Single-Cent Checksum Tip Calculator for Restaurant & Bar Receipts
          </p>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>Example: 46.11 → 4+6+1=11 (ones 1 = 1)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
