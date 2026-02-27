"use client";

import { useMemo, useState, useCallback, useEffect } from "react";

function parseNum(val: string): number | null {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

const CURRENCIES = [
  { value: "GH₵", label: "🇬🇭 GH₵ — Ghana Cedis" },
  { value: "CFA", label: "🇨🇮 CFA — CFA Franc" },
  { value: "₦", label: "🇳🇬 ₦ — Nigerian Naira" },
  { value: "$", label: "🇺🇸 $ — US Dollar" },
  { value: "¥", label: "🇨🇳 ¥ — Chinese Yuan" },
  { value: "€", label: "🇪🇺 € — Euro" },
  { value: "£", label: "🇬🇧 £ — British Pound" },
] as const;

function formatMoney(n: number | null, symbol: string): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return (
    symbol +
    " " +
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function pct(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return (
    n.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }) + "%"
  );
}

const inputCls =
  "w-full min-h-[44px] px-3 py-2.5 bg-[var(--bg-input)] border-[1.5px] border-[var(--border)] rounded-[10px] text-[var(--text-primary)] font-medium placeholder:text-[var(--text-tertiary)] focus:border-[#3b82f6] focus:outline-none focus:ring-[3px] focus:ring-[rgba(59,130,246,0.15)] transition-[border-color,box-shadow]";

const prefixCls =
  "inline-flex items-center justify-center px-3 py-2.5 min-h-[44px] text-sm font-semibold text-[var(--text-secondary)] bg-[var(--bg-elevated)] border-[1.5px] border-[var(--border)] border-r-0 rounded-l-[10px] whitespace-nowrap select-none";

const suffixCls =
  "inline-flex items-center justify-center px-3 py-2.5 min-h-[44px] text-sm font-semibold text-[var(--text-secondary)] bg-[var(--bg-elevated)] border-[1.5px] border-[var(--border)] border-l-0 rounded-r-[10px] whitespace-nowrap select-none";

const inputWithPrefixCls =
  "w-full min-h-[44px] px-3 py-2.5 bg-[var(--bg-input)] border-[1.5px] border-[var(--border)] rounded-r-[10px] rounded-l-none text-[var(--text-primary)] font-medium placeholder:text-[var(--text-tertiary)] focus:border-[#3b82f6] focus:outline-none focus:ring-[3px] focus:ring-[rgba(59,130,246,0.15)] transition-[border-color,box-shadow]";

const inputWithSuffixCls =
  "w-full min-h-[44px] px-3 py-2.5 bg-[var(--bg-input)] border-[1.5px] border-[var(--border)] rounded-l-[10px] rounded-r-none text-[var(--text-primary)] font-medium placeholder:text-[var(--text-tertiary)] focus:border-[#3b82f6] focus:outline-none focus:ring-[3px] focus:ring-[rgba(59,130,246,0.15)] transition-[border-color,box-shadow]";

export default function Home() {
  const [costBox, setCostBox] = useState("");
  const [qty, setQty] = useState("");
  const [unitCostInput, setUnitCostInput] = useState("");
  const [manualUnitCost, setManualUnitCost] = useState(false);
  const [profitPctInput, setProfitPctInput] = useState("25");
  const [sliderVal, setSliderVal] = useState(25);
  const [unitSellInput, setUnitSellInput] = useState("");
  const [deduction, setDeduction] = useState("0");
  const [pricingMode, setPricingMode] = useState<"profit" | "selling">(
    "profit"
  );
  const [copied, setCopied] = useState(false);
  const [currency, setCurrency] = useState("GH₵");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  const m = useCallback(
    (n: number | null) => formatMoney(n, currency),
    [currency]
  );

  const autoUnitCost = useMemo(() => {
    const c = parseNum(costBox);
    const q = parseNum(qty);
    if (c != null && q != null && q > 0) return c / q;
    return null;
  }, [costBox, qty]);

  useEffect(() => {
    if (!manualUnitCost && autoUnitCost != null) {
      setUnitCostInput(autoUnitCost.toFixed(4));
    }
  }, [manualUnitCost, autoUnitCost]);

  const unitCost = useMemo(() => {
    if (manualUnitCost) return parseNum(unitCostInput);
    return autoUnitCost;
  }, [manualUnitCost, unitCostInput, autoUnitCost]);

  const results = useMemo(() => {
    const costBoxVal = parseNum(costBox);
    const qtyVal = parseNum(qty);
    const ded = parseNum(deduction) ?? 0;

    let profitPercent: number | null = null;
    let unitSelling: number | null = null;
    let unitProfit: number | null = null;

    if (pricingMode === "profit") {
      profitPercent = parseNum(profitPctInput);
      if (unitCost != null && profitPercent != null) {
        unitProfit = unitCost * (profitPercent / 100);
        unitSelling = unitCost + unitProfit;
      }
    } else {
      const sell = parseNum(unitSellInput);
      if (sell != null) {
        unitSelling = sell;
        if (unitCost != null && unitCost > 0) {
          profitPercent = ((unitSelling - unitCost) / unitCost) * 100;
        }
        unitProfit = unitCost != null ? unitSelling - unitCost : null;
      }
    }

    const sellingBox =
      unitSelling != null && qtyVal != null
        ? unitSelling * qtyVal - ded
        : null;

    const unitMargin =
      unitSelling != null && unitCost != null
        ? unitSelling - unitCost
        : null;

    const boxMargin =
      sellingBox != null && costBoxVal != null
        ? sellingBox - costBoxVal
        : null;

    return {
      unitCost,
      profitPercent,
      unitProfit,
      unitSelling,
      sellingBox,
      unitMargin,
      boxMargin,
    };
  }, [costBox, qty, unitCost, pricingMode, profitPctInput, unitSellInput, deduction]);

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setSliderVal(v);
    setProfitPctInput(v.toFixed(1));
  };

  const handleProfitInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setProfitPctInput(raw);
    const v = parseNum(raw);
    if (v != null) {
      setSliderVal(Math.max(0.5, Math.min(500, v)));
    }
  };

  const handleToggleManual = (checked: boolean) => {
    setManualUnitCost(checked);
    if (checked) setUnitCostInput("");
  };

  const getPrices = useCallback(async () => {
    const text = [
      "Product Price Calculator — All values",
      "By Fosberg Addai · Addapaul Ventures",
      "",
      "——— INPUTS ———",
      `Cost price (box / ctn / pck): ${costBox}`,
      `Quantity in box / ctn / pck: ${qty}`,
      `Unit cost price: ${m(results.unitCost)}`,
      `Profit %: ${pct(results.profitPercent)}`,
      `Deduction: ${deduction}`,
      "",
      "——— RESULTS ———",
      `Unit cost price: ${m(results.unitCost)}`,
      `Unit profit: ${m(results.unitProfit)}`,
      `Unit selling price: ${m(results.unitSelling)}`,
      `Selling price (box / ctn / pck): ${m(results.sellingBox)}`,
      `Unit profit margin: ${m(results.unitMargin)}`,
      `Box / ctn / pck profit margin: ${m(results.boxMargin)}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [costBox, qty, deduction, results, m]);

  const valColor = (v: number | null) => {
    if (v == null) return "text-[var(--color-green)]";
    return v < 0 ? "text-[var(--color-red)]" : "text-[var(--color-green)]";
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-[1000px] px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
        {/* Header */}
        <header className="text-center pb-6 sm:pb-8 pt-4 sm:pt-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-[#3b82f6] to-[#6366f1] mb-4 shadow-[0_8px_24px_rgba(59,130,246,0.25)]">
            <svg
              className="w-7 h-7 fill-white"
              viewBox="0 0 24 24"
            >
              <path d="M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-9-1c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-6v11c0 1.1-.9 2-2 2H4v-2h17V7h2z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-linear-to-br from-[var(--heading-from)] to-[var(--heading-to)] bg-clip-text text-transparent mb-1">
            Product Price Calculator
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-tertiary)]">
            by{" "}
            <strong className="text-[#3b82f6] font-semibold">
              Fosberg Addai
            </strong>{" "}
            ·{" "}
            <a
              href="tel:+233552412180"
              className="text-[var(--color-green)] font-medium hover:underline whitespace-nowrap"
            >
              Call :)
            </a>{" "}
            · Addapaul Ventures
          </p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-card)] border-[1.5px] border-[var(--border)] rounded-full cursor-pointer outline-none transition-[border-color,box-shadow] focus:border-[#3b82f6] focus:ring-[3px] focus:ring-[rgba(59,130,246,0.15)] appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%2394a3b8%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-position-[right_0.7rem_center] pr-8"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg-card)] border-[1.5px] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] transition-colors"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="5" />
                  <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Main layout */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 items-start">
          {/* INPUTS CARD */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6 transition-colors hover:border-[var(--border-hover)] animate-[fadeSlideUp_0.4s_ease-out_backwards]">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-[var(--border)]">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] bg-[rgba(59,130,246,0.15)]">
                <svg
                  className="w-[18px] h-[18px] fill-[#3b82f6]"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
              </div>
              <span className="text-[0.95rem] font-bold">Input Values</span>
            </div>

            <div className="space-y-4">
              {/* Cost Price */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Cost Price (Box / Ctn / Pck)
                </label>
                <div className="flex items-center">
                  <span className={prefixCls}>{currency}</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={costBox}
                    onChange={(e) => setCostBox(e.target.value)}
                    className={inputWithPrefixCls}
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Quantity in Box / Ctn / Pck
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="e.g. 12"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Unit Cost */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Unit Cost Price
                </label>
                <div className="flex items-center">
                  <span className={prefixCls}>{currency}</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="Auto-calculated"
                    value={unitCostInput}
                    readOnly={!manualUnitCost}
                    onChange={(e) => setUnitCostInput(e.target.value)}
                    className={`${inputWithPrefixCls} ${!manualUnitCost ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                </div>
                <div className="flex items-center gap-2.5 mt-2">
                  <label className="relative w-[38px] h-[22px] shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualUnitCost}
                      onChange={(e) => handleToggleManual(e.target.checked)}
                      className="sr-only peer"
                    />
                    <span className="absolute inset-0 bg-[var(--border)] rounded-full transition-colors peer-checked:bg-[#3b82f6]" />
                    <span className="absolute left-[3px] top-[3px] w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                  </label>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {manualUnitCost
                      ? "Entering unit cost manually"
                      : "Auto-calculated from cost ÷ quantity"}
                  </span>
                </div>
              </div>

              {/* Pricing Method */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Pricing Method
                </label>
                <div className="flex bg-[var(--bg-segment)] rounded-[10px] p-[3px] border border-[var(--border)] mb-3">
                  <button
                    type="button"
                    onClick={() => setPricingMode("profit")}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg text-center transition-all ${
                      pricingMode === "profit"
                        ? "bg-[var(--bg-segment-active)] text-[var(--text-primary)] shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    Set Profit %
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingMode("selling")}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg text-center transition-all ${
                      pricingMode === "selling"
                        ? "bg-[var(--bg-segment-active)] text-[var(--text-primary)] shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    Set Selling Price
                  </button>
                </div>

                {pricingMode === "profit" ? (
                  <div>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min={0.5}
                        max={500}
                        step={0.5}
                        placeholder="e.g. 25"
                        value={profitPctInput}
                        onChange={handleProfitInput}
                        className={inputWithSuffixCls}
                      />
                      <span className={suffixCls}>%</span>
                    </div>
                    <div className="mt-3">
                      <input
                        type="range"
                        min={0.5}
                        max={500}
                        step={0.5}
                        value={sliderVal}
                        onChange={handleSlider}
                        className="w-full h-1.5"
                      />
                      <div className="flex justify-between text-[0.65rem] text-[var(--text-tertiary)] mt-1 px-0.5">
                        <span>0.5%</span>
                        <span>50%</span>
                        <span>100%</span>
                        <span>250%</span>
                        <span>500%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className={prefixCls}>{currency}</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="Enter unit selling price"
                      value={unitSellInput}
                      onChange={(e) => setUnitSellInput(e.target.value)}
                      className={inputWithPrefixCls}
                    />
                  </div>
                )}
              </div>

              {/* Deduction */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Deduction from Box / Ctn / Pck Price
                </label>
                <div className="flex items-center">
                  <span className={prefixCls}>{currency}</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="e.g. 5"
                    value={deduction}
                    onChange={(e) => setDeduction(e.target.value)}
                    className={inputWithPrefixCls}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* RESULTS CARD */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6 transition-colors hover:border-[var(--border-hover)] animate-[fadeSlideUp_0.4s_ease-out_0.1s_backwards]">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-[var(--border)]">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] bg-[rgba(34,197,94,0.12)]">
                <svg
                  className="w-[18px] h-[18px] fill-[var(--color-green)]"
                  viewBox="0 0 24 24"
                >
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                </svg>
              </div>
              <span className="text-[0.95rem] font-bold">Results</span>
            </div>

            {/* Highlight cards */}
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 mb-4">
              <div className="bg-[var(--bg-input)] border border-[rgba(245,158,11,0.25)] rounded-xl p-4 text-center shadow-[0_0_20px_rgba(245,158,11,0.05)]">
                <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                  Unit Selling Price
                </div>
                <div className="text-xl sm:text-2xl font-extrabold tabular-nums text-[var(--color-amber)]">
                  {m(results.unitSelling)}
                </div>
              </div>
              <div className="bg-[var(--bg-input)] border border-[rgba(34,197,94,0.25)] rounded-xl p-4 text-center shadow-[0_0_20px_rgba(34,197,94,0.05)]">
                <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                  Box / Ctn / Pck Price
                </div>
                <div className="text-xl sm:text-2xl font-extrabold tabular-nums text-[var(--color-green)]">
                  {m(results.sellingBox)}
                </div>
              </div>
            </div>

            <div className="h-px bg-[var(--border)] mb-4" />

            {/* Detailed rows */}
            <div>
              <ResultRow
                name="Unit Cost Price"
                sub="Cost per single unit"
                value={m(results.unitCost)}
                colorCls="text-[var(--text-primary)]"
              />
              <ResultRow
                name="Profit Percentage"
                sub="Markup on cost"
                value={pct(results.profitPercent)}
                colorCls="text-[#3b82f6]"
              />
              <ResultRow
                name="Unit Profit"
                sub="Profit per unit sold"
                value={m(results.unitProfit)}
                colorCls={valColor(results.unitProfit)}
              />
              <ResultRow
                name="Unit Selling Price"
                sub="Price per single unit"
                value={m(results.unitSelling)}
                colorCls="text-[var(--color-amber)]"
              />
              <ResultRow
                name="Box / Ctn / Pck Selling Price"
                sub="After deduction applied"
                value={m(results.sellingBox)}
                colorCls="text-[var(--color-amber)]"
              />
              <ResultRow
                name="Unit Profit Margin"
                sub="Selling price − cost per unit"
                value={m(results.unitMargin)}
                colorCls={valColor(results.unitMargin)}
              />
              <ResultRow
                name="Box / Ctn / Pck Profit Margin"
                sub="Box selling price − box cost price"
                value={m(results.boxMargin)}
                colorCls={valColor(results.boxMargin)}
                isLast
              />
            </div>
          </section>
        </div>

        {/* Copy button */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={getPrices}
            className="inline-flex items-center gap-2 rounded-full bg-[#3b82f6] px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2 focus:ring-offset-[var(--bg-page)]"
          >
            {copied ? "Copied!" : "Copy All Prices"}
          </button>
        </div>

        <footer className="text-center py-8 text-sm text-[var(--text-tertiary)]">
          <span className="text-[var(--text-secondary)] font-semibold">
            Product Price Calculator
          </span>{" "}
          · by Fosberg Addai ·{" "}
          <a
            href="tel:+233552412180"
            className="text-[var(--color-green)] font-medium hover:underline whitespace-nowrap"
          >
            +233 55 241 2180
          </a>{" "}
          · Addapaul Ventures
        </footer>
      </div>
    </div>
  );
}

function ResultRow({
  name,
  sub,
  value,
  colorCls,
  isLast = false,
}: {
  name: string;
  sub: string;
  value: string;
  colorCls: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center gap-4 py-3 ${
        isLast ? "" : "border-b border-[var(--border)]"
      }`}
    >
      <div className="flex flex-col min-w-0">
        <span className="text-[0.82rem] font-medium text-[var(--text-secondary)]">
          {name}
        </span>
        <span className="text-[0.7rem] text-[var(--text-tertiary)]">{sub}</span>
      </div>
      <span
        className={`text-[1.05rem] font-bold tabular-nums whitespace-nowrap ${colorCls}`}
      >
        {value}
      </span>
    </div>
  );
}
