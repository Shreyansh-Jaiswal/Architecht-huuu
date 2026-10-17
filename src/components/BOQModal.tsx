import React, { useState } from 'react';
import { X, DollarSign, Calculator, Download, CheckCircle, Building2, HardHat } from 'lucide-react';
import { BOQItem, ArchitectureModelData } from '../types/architect.ts';

interface BOQModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ArchitectureModelData;
}

export const BOQModal: React.FC<BOQModalProps> = ({ isOpen, onClose, data }) => {
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  if (!isOpen) return null;

  const exportBOQCSV = () => {
    const headers = ['Category', 'Item Description', 'Unit', 'Quantity', `Rate (${currency})`, `Total (${currency})`];
    const rows = data.boq.map(item => [
      `"${item.category}"`,
      `"${item.name}"`,
      `"${item.unit}"`,
      item.quantity,
      currency === 'INR' ? item.rateINR : item.rateUSD,
      currency === 'INR' ? item.totalINR : item.totalUSD,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Bill_of_Quantities_${data.specs.buildingType}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const totalAmount = currency === 'INR' ? data.totalCostINR : data.totalCostUSD;
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0c1222] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-900/40 bg-[#070b14]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Engineering Bill of Quantities (BOQ)
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  ISO & NBC Compliant
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Detailed material estimates for {data.totalBuiltUpAreaM2} m² ({Math.round(data.totalBuiltUpAreaM2 * 10.7639)} sq.ft) built-up area
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency Switcher */}
            <div className="flex items-center bg-[#050811] border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setCurrency('INR')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  currency === 'INR' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                ₹ INR
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  currency === 'USD' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                $ USD
              </button>
            </div>

            <button
              onClick={onClose}
              aria-label="Close BOQ modal"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Total Cost Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-4 bg-[#0a0f1d] border-b border-cyan-900/30">
          <div className="p-3 bg-[#070b14] border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400 font-medium">Estimated Project Budget</div>
            <div className="text-2xl font-extrabold text-emerald-400 tracking-tight mt-1">
              {currencySymbol} {totalAmount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {currency === 'INR' ? `₹ ${Math.round(data.totalCostINR / (data.totalBuiltUpAreaM2 * 10.7639))} / sq.ft` : `$ ${Math.round(data.totalCostUSD / (data.totalBuiltUpAreaM2 * 10.7639))} / sq.ft`} (Turnkey Civil + MEP)
            </div>
          </div>

          <div className="p-3 bg-[#070b14] border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400 font-medium">Structure Program</div>
            <div className="text-lg font-bold text-white mt-1">
              {data.specs.floorsKey} ({data.specs.floorsCount} Floors)
            </div>
            <div className="text-[11px] text-cyan-400 mt-0.5">
              {data.specs.hasBasement ? 'Includes Reinforced Subterranean Basement' : 'Grade Level Foundation'}
            </div>
          </div>

          <div className="p-3 bg-[#070b14] border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400 font-medium">Plot Footprint / Setbacks</div>
            <div className="text-lg font-bold text-cyan-300 mt-1">
              {data.footprintWidthM}m × {data.footprintDepthM}m
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Road buffer: {data.specs.setbacks.front}m | Rear: {data.specs.setbacks.rear}m
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[50vh]">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#070b14]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Specification / Item</th>
                  <th className="py-3 px-3 font-semibold text-center">Unit</th>
                  <th className="py-3 px-3 font-semibold text-right">Quantity</th>
                  <th className="py-3 px-4 font-semibold text-right">Rate ({currencySymbol})</th>
                  <th className="py-3 px-4 font-semibold text-right">Total ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {data.boq.map(item => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-cyan-400 whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400">
                      {item.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-200">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {(currency === 'INR' ? item.rateINR : item.rateUSD).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      {(currency === 'INR' ? item.totalINR : item.totalUSD).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-cyan-900/40 bg-[#070b14]">
          <span className="text-xs text-slate-500">
            * Estimates calculated as per CPWD & RSMeans standard parametric architectural metrics.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={exportBOQCSV}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Export BOQ (CSV)
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
