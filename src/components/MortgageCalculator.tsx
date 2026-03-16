import { useState, useMemo, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentFrequency = 'monthly' | 'biweekly' | 'accelerated-biweekly';
type DownMode = 'percent' | 'dollar';

interface YearlyRow {
  year: number;
  interest: number;
  principal: number;
  balance: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AMORTIZATION_OPTIONS = Array.from({ length: 26 }, (_, i) => i + 5);

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtCents(n: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

// ─── Financial Calculations ───────────────────────────────────────────────────

/**
 * Canadian semi-annual compounding → periodic payment rate.
 * i = (1 + r/2)^(2/p) − 1
 */
function periodicRate(annualRate: number, paymentsPerYear: number): number {
  return Math.pow(1 + annualRate / 2, 2 / paymentsPerYear) - 1;
}

/**
 * Standard annuity payment formula: M = P · i(1+i)^n / ((1+i)^n − 1)
 */
function calcPayment(P: number, i: number, n: number): number {
  if (i === 0) return P / n;
  const factor = Math.pow(1 + i, n);
  return (P * (i * factor)) / (factor - 1);
}

function getCmhcRate(downPercent: number): number {
  if (downPercent >= 20) return 0;
  if (downPercent >= 15) return 0.028;
  if (downPercent >= 10) return 0.031;
  if (downPercent >= 5) return 0.04;
  return 0;
}

/** Minimum down payment required in Canada (tiered sliding scale). */
function calcMinDownPayment(price: number): number {
  if (price >= 1_000_000) return price * 0.20;
  if (price > 500_000) return 500_000 * 0.05 + (price - 500_000) * 0.10;
  return price * 0.05;
}

/** Ontario provincial LTT (5-bracket schedule). */
function calcLTT(price: number): number {
  let remaining = price;
  let tax = 0;
  const brackets: [number, number][] = [
    [2_000_000, 0.025],
    [400_000, 0.02],
    [250_000, 0.015],
    [55_000, 0.01],
    [0, 0.005],
  ];
  for (const [threshold, rate] of brackets) {
    if (remaining > threshold) {
      tax += (remaining - threshold) * rate;
      remaining = threshold;
    }
  }
  return tax;
}

/**
 * Toronto Municipal LTT — uses the same base brackets as the provincial LTT
 * plus additional "luxury" brackets introduced in 2024 for high-value properties.
 */
function calcTorontoLTT(price: number): number {
  let remaining = price;
  let tax = 0;
  const brackets: [number, number][] = [
    [20_000_000, 0.075],
    [10_000_000, 0.065],
    [5_000_000, 0.055],
    [4_000_000, 0.045],
    [3_000_000, 0.035],
    [2_000_000, 0.025],
    [400_000, 0.02],
    [250_000, 0.015],
    [55_000, 0.01],
    [0, 0.005],
  ];
  for (const [threshold, rate] of brackets) {
    if (remaining > threshold) {
      tax += (remaining - threshold) * rate;
      remaining = threshold;
    }
  }
  return tax;
}

function buildAmortSchedule(
  principal: number,
  pRate: number,
  payment: number,
  paymentsPerYear: number,
  maxYears: number,
): YearlyRow[] {
  let balance = principal;
  const rows: YearlyRow[] = [];

  for (let year = 1; year <= maxYears; year++) {
    let yearInterest = 0;
    let yearPrincipal = 0;
    for (let p = 0; p < paymentsPerYear; p++) {
      if (balance < 0.01) break;
      const interest = balance * pRate;
      const principalPay = Math.min(balance, payment - interest);
      yearInterest += interest;
      yearPrincipal += principalPay;
      balance = Math.max(0, balance - principalPay);
    }
    rows.push({
      year,
      interest: yearInterest,
      principal: yearPrincipal,
      balance: Math.max(0, balance),
    });
    if (balance < 0.01) break;
  }
  return rows;
}

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="h-5 w-9 rounded-full bg-slate-200 transition-colors peer-checked:bg-amber-500" />
        <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MortgageCalculator() {
  // ── Inputs ─────────────────────────────────────────────────────────────────
  const [homePrice, setHomePrice] = useState(550_000);
  const [rawPriceInput, setRawPriceInput] = useState('550000');
  const [downMode, setDownMode] = useState<DownMode>('percent');
  const [downPercent, setDownPercent] = useState(20);
  const [downDollar, setDownDollar] = useState(110_000);
  const [rateInput, setRateInput] = useState('4.25');
  const [amortization, setAmortization] = useState(25);
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly');
  const [inToronto, setInToronto] = useState(false);
  const [firstTimeBuyer, setFirstTimeBuyer] = useState(false);

  // ── Chart (SSR-safe dynamic import) ────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Chart, setChart] = useState<any>(null);
  useEffect(() => {
    import('react-apexcharts').then((mod) => setChart(() => mod.default));
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────
  const annualRate = Math.max(0, parseFloat(rateInput) / 100 || 0);

  const downPaymentDollar = useMemo(
    () =>
      downMode === 'percent'
        ? Math.round(homePrice * (downPercent / 100))
        : downDollar,
    [downMode, homePrice, downPercent, downDollar],
  );

  const downPaymentPercent = useMemo(
    () =>
      downMode === 'dollar'
        ? homePrice > 0
          ? (downDollar / homePrice) * 100
          : 0
        : downPercent,
    [downMode, homePrice, downPercent, downDollar],
  );

  const isUninsurable = homePrice >= 1_000_000;
  const loanBeforeCmhc = Math.max(0, homePrice - downPaymentDollar);
  const cmhcRate = isUninsurable ? 0 : getCmhcRate(downPaymentPercent);
  const cmhcAmount = Math.round(loanBeforeCmhc * cmhcRate);
  const pstOnCmhc = Math.round(cmhcAmount * 0.08); // 8% Ontario PST — paid upfront, NOT added to mortgage
  const principal = loanBeforeCmhc + cmhcAmount;

  const paymentsPerYear = frequency === 'monthly' ? 12 : 26;

  const pRate = useMemo(
    () => periodicRate(annualRate, paymentsPerYear),
    [annualRate, paymentsPerYear],
  );

  // Accelerated bi-weekly: use monthly payment ÷ 2 as the per-period amount,
  // applied 26 times/year - effectively paying one extra monthly instalment per year.
  const periodicPayment = useMemo(() => {
    if (principal <= 0 || annualRate <= 0) return 0;
    if (frequency === 'accelerated-biweekly') {
      const monthlyI = periodicRate(annualRate, 12);
      return calcPayment(principal, monthlyI, amortization * 12) / 2;
    }
    return calcPayment(principal, pRate, amortization * paymentsPerYear);
  }, [principal, annualRate, frequency, amortization, pRate, paymentsPerYear]);

  const monthlyEquivalent =
    frequency === 'monthly'
      ? periodicPayment
      : (periodicPayment * 26) / 12;

  // ── Amortization schedule ────────────────────────────────────────────────────
  const amortSchedule = useMemo(() => {
    if (principal <= 0 || annualRate <= 0 || periodicPayment <= 0) return [];
    return buildAmortSchedule(principal, pRate, periodicPayment, paymentsPerYear, amortization);
  }, [principal, pRate, periodicPayment, paymentsPerYear, amortization, annualRate]);

  const totalInterest = useMemo(
    () => amortSchedule.reduce((acc, r) => acc + r.interest, 0),
    [amortSchedule],
  );

  const actualYears = amortSchedule.length;

  // ── Land Transfer Tax ────────────────────────────────────────────────────────
  const provincialLTT = useMemo(() => calcLTT(homePrice), [homePrice]);
  const torontoLTT = useMemo(
    () => (inToronto ? calcTorontoLTT(homePrice) : 0),
    [homePrice, inToronto],
  );
  const grossLTT = provincialLTT + torontoLTT;

  const ftbRebate = useMemo(() => {
    if (!firstTimeBuyer) return 0;
    let r = Math.min(provincialLTT, 4_000);
    if (inToronto) r += Math.min(torontoLTT, 4_475);
    return r;
  }, [firstTimeBuyer, provincialLTT, torontoLTT, inToronto]);

  const netLTT = Math.max(0, grossLTT - ftbRebate);

  // ── Input handlers ───────────────────────────────────────────────────────────
  function applyHomePrice(val: number) {
    const clamped = Math.max(0, Math.min(5_000_000, val));
    setHomePrice(clamped);
    setRawPriceInput(String(clamped));
    if (downMode === 'percent') {
      setDownDollar(Math.round(clamped * (downPercent / 100)));
    }
  }

  function applyDownPercent(val: number) {
    const clamped = Math.max(0, Math.min(100, val));
    setDownPercent(clamped);
    setDownDollar(Math.round(homePrice * (clamped / 100)));
  }

  function applyDownDollar(val: number) {
    const clamped = Math.max(0, Math.min(homePrice, val));
    setDownDollar(clamped);
    setDownPercent(homePrice > 0 ? (clamped / homePrice) * 100 : 0);
  }

  // ── Chart data ────────────────────────────────────────────────────────────────
  const chartSeries = useMemo(
    () => [
      { name: 'Principal', data: amortSchedule.map((r) => Math.round(r.principal)) },
      { name: 'Interest', data: amortSchedule.map((r) => Math.round(r.interest)) },
    ],
    [amortSchedule],
  );
  const chartCategories = amortSchedule.map((r) => `Yr ${r.year}`);

  const minDownDollar = homePrice > 0 ? calcMinDownPayment(homePrice) : 0;
  const isHighRatio = !isUninsurable && downPaymentPercent > 0 && downPaymentPercent < 20;
  const isBelowMinimum = homePrice > 0 && downPaymentDollar < minDownDollar;
  const hasResults = periodicPayment > 0;

  // ── Responsive label for payment frequency ────────────────────────────────────
  const freqLabel =
    frequency === 'monthly'
      ? 'Monthly'
      : frequency === 'biweekly'
        ? 'Bi-Weekly'
        : 'Accel. Bi-Weekly';

  return (
    <div className="space-y-5">
      {/* ── Input Card ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display mb-5 text-xl text-slate-900">Mortgage Details</h2>

        <div className="space-y-5">
          {/* Property Value */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Property Value
            </label>
            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200">
              <span className="flex items-center border-r border-slate-200 bg-slate-100 px-3 text-sm font-medium text-slate-500">
                $
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={rawPriceInput}
                onChange={(e) => {
                  setRawPriceInput(e.target.value);
                  const n = parseFloat(e.target.value);
                  if (!isNaN(n)) applyHomePrice(n);
                }}
                onBlur={() => setRawPriceInput(String(homePrice))}
                className="min-w-0 flex-1 bg-transparent py-2.5 pl-3 pr-4 text-sm font-medium text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Down Payment */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Down Payment</label>
            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200">
              {/* Mode toggle - fused to the left */}
              <div className="flex shrink-0 border-r border-slate-200">
                {(['percent', 'dollar'] as DownMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDownMode(m)}
                    className={`px-3 py-2.5 text-xs font-semibold transition-colors ${
                      downMode === m
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    } first:rounded-none last:border-l last:border-slate-200`}
                  >
                    {m === 'percent' ? '%' : '$'}
                  </button>
                ))}
              </div>

              {/* Numeric input */}
              {downMode === 'percent' ? (
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.5}
                  value={downPercent}
                  onChange={(e) => applyDownPercent(parseFloat(e.target.value) || 0)}
                  className="min-w-0 flex-1 bg-transparent py-2.5 pl-3 pr-3 text-sm font-medium text-slate-800 focus:outline-none"
                />
              ) : (
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={homePrice}
                  value={downDollar}
                  onChange={(e) => applyDownDollar(parseFloat(e.target.value) || 0)}
                  className="min-w-0 flex-1 bg-transparent py-2.5 pl-3 pr-3 text-sm font-medium text-slate-800 focus:outline-none"
                />
              )}

              {/* Secondary equivalent - right side */}
              <span className="flex items-center border-l border-slate-200 bg-slate-100 px-3 text-sm text-slate-500">
                {downMode === 'percent' ? fmt(downPaymentDollar) : `${downPaymentPercent.toFixed(1)}%`}
              </span>
            </div>

            {isUninsurable && (
              <p className="mt-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
                Homes priced at $1,000,000+ require a minimum 20% down payment and are not eligible for CMHC default insurance.
              </p>
            )}
            {!isUninsurable && isBelowMinimum && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">
                Minimum down payment: 5% on the first $500,000 + 10% on the portion above $500,000
                {homePrice > 500_000 ? ` = ${fmt(minDownDollar)}` : ''}.
              </p>
            )}
            {isHighRatio && !isBelowMinimum && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                High-ratio mortgage — CMHC insurance required ({(cmhcRate * 100).toFixed(2)}%
                premium on loan). Ontario PST of 8% on the premium is due upfront at closing.
              </p>
            )}
          </div>

          {/* Rate + Amortization */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Interest Rate
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={30}
                  step={0.05}
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-8 text-sm font-medium text-slate-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  %
                </span>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Amortization
              </label>
              <div className="relative">
                <select
                  value={amortization}
                  onChange={(e) => setAmortization(Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-8 text-sm font-medium text-slate-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                >
                  {AMORTIZATION_OPTIONS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr} years
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Payment Frequency */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Payment Frequency
            </label>
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {(
                [
                  ['monthly', 'Monthly'],
                  ['biweekly', 'Bi-Weekly'],
                  ['accelerated-biweekly', 'Accelerated\u00a0Bi-Weekly'],
                ] as [PaymentFrequency, string][]
              ).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFrequency(val)}
                  className={`rounded-lg px-2 py-2 text-xs font-medium leading-tight transition-colors ${
                    frequency === val
                      ? 'border border-amber-200 bg-white text-amber-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {frequency === 'accelerated-biweekly' && (
              <p className="mt-2 text-xs text-slate-500">
                Same payment as bi-weekly but half of monthly - 26 payments/year effectively
                adds one extra monthly payment, reducing your amortization.
              </p>
            )}
          </div>

          {/* Location Toggles */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
            <Toggle
              checked={inToronto}
              onChange={setInToronto}
              label="Property is in Toronto"
            />
            <Toggle
              checked={firstTimeBuyer}
              onChange={setFirstTimeBuyer}
              label="First-time homebuyer"
            />
          </div>
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      {hasResults && (
        <>
          {/* Primary Payment Card */}
          <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm sm:p-6">
            <p className="text-sm font-medium text-slate-400">{freqLabel} Payment</p>
            <p className="font-display mt-1 text-5xl tracking-tight text-white sm:text-6xl">
              {fmtCents(periodicPayment)}
            </p>
            {frequency !== 'monthly' && (
              <p className="mt-1.5 text-sm text-slate-400">
                ≈&nbsp;{fmtCents(monthlyEquivalent)}&nbsp;/ month equivalent
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-700 pt-5 sm:grid-cols-4">
              <Stat label="Mortgage Amount" value={fmt(principal)} />
              <Stat label="Total Interest" value={fmt(totalInterest)} />
              <Stat
                label="Cost of Borrowing"
                value={fmt(totalInterest + cmhcAmount)}
                accent
              />
              <Stat label="Total Repaid" value={fmt(principal + totalInterest)} />
            </div>

            {frequency === 'accelerated-biweekly' && actualYears < amortization && (
              <p className="mt-4 rounded-xl bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
                Paid off in{' '}
                <strong>
                  {actualYears} year{actualYears !== 1 ? 's' : ''}
                </strong>{' '}
                - {amortization - actualYears} year{amortization - actualYears !== 1 ? 's' : ''}{' '}
                sooner than your {amortization}-year amortization.
              </p>
            )}
          </div>

          {/* Closing Costs Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-display mb-4 text-xl text-slate-900">Closing Costs</h2>

            <div className="space-y-3">
              {/* CMHC Row */}
              {cmhcAmount > 0 ? (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-amber-800">CMHC Insurance</p>
                      <p className="text-xs text-amber-600">
                        {(cmhcRate * 100).toFixed(2)}% of {fmt(loanBeforeCmhc)} loan — added to mortgage
                      </p>
                    </div>
                    <p className="text-base font-bold text-amber-700">{fmt(cmhcAmount)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-amber-200 pt-2">
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Ontario PST on CMHC</p>
                      <p className="text-xs text-amber-600">8% of premium — paid upfront at closing</p>
                    </div>
                    <p className="text-base font-bold text-amber-700">{fmt(pstOnCmhc)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">CMHC Insurance</p>
                    <p className="text-xs text-emerald-600">
                      {isUninsurable ? 'Not available — homes priced at $1M+ are uninsurable' : 'Not required — down payment ≥ 20%'}
                    </p>
                  </div>
                  <p className="text-base font-bold text-emerald-700">$0</p>
                </div>
              )}

              {/* LTT Breakdown */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Ontario Land Transfer Tax</span>
                    <span className="font-semibold text-slate-700">{fmt(provincialLTT)}</span>
                  </div>
                  {inToronto && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Toronto Municipal LTT</span>
                      <span>{fmt(torontoLTT)}</span>
                    </div>
                  )}
                  {firstTimeBuyer && ftbRebate > 0 && (
                    <div className="flex items-center justify-between text-emerald-700">
                      <span>First-Time Buyer Rebate</span>
                      <span className="font-medium">−{fmt(ftbRebate)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                    <span className="font-bold text-slate-800">Net Land Transfer Tax</span>
                    <span className="font-bold text-slate-800">{fmt(netLTT)}</span>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-white">Total Estimated Closing Costs</p>
                  {pstOnCmhc > 0 && (
                    <p className="text-xs text-slate-400">LTT + PST on CMHC (excl. premium added to mortgage)</p>
                  )}
                </div>
                <p className="text-base font-bold text-amber-400">{fmt(netLTT + pstOnCmhc)}</p>
              </div>
            </div>
          </div>

          {/* Amortization Schedule Card */}
          {amortSchedule.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-display mb-1 text-xl text-slate-900">Amortization Schedule</h2>
              <p className="mb-4 text-sm text-slate-500">
                Annual breakdown of principal vs. interest over{' '}
                {actualYears < amortization ? (
                  <span>
                    {actualYears} year{actualYears !== 1 ? 's' : ''} (paid off early)
                  </span>
                ) : (
                  <span>{amortization} years</span>
                )}
              </p>

              {/* Stacked Bar Chart */}
              {Chart && (
                <div className="-mx-1 mb-5">
                  <Chart
                    type="bar"
                    height={260}
                    series={chartSeries}
                    options={{
                      chart: {
                        stacked: true,
                        toolbar: { show: false },
                        fontFamily: 'DM Sans, sans-serif',
                        background: 'transparent',
                        animations: { enabled: false },
                      },
                      colors: ['#f59e0b', '#cbd5e1'],
                      plotOptions: { bar: { columnWidth: '70%' } },
                      xaxis: {
                        categories: chartCategories,
                        labels: {
                          style: { colors: '#94a3b8', fontSize: '11px' },
                          rotate: chartCategories.length > 20 ? -45 : 0,
                        },
                        axisBorder: { show: false },
                        axisTicks: { show: false },
                      },
                      yaxis: {
                        labels: {
                          style: { colors: '#94a3b8', fontSize: '11px' },
                          formatter: (v: number) => `$${Math.round(v / 1_000)}k`,
                        },
                      },
                      legend: {
                        position: 'top',
                        fontFamily: 'DM Sans, sans-serif',
                        labels: { colors: ['#b45309', '#64748b'] },
                      },
                      grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
                      tooltip: {
                        y: { formatter: (v: number) => fmt(v) },
                      },
                      dataLabels: { enabled: false },
                    }}
                  />
                </div>
              )}

              {/* Annual Summary Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Year
                      </th>
                      <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-amber-600">
                        Interest
                      </th>
                      <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Principal
                      </th>
                      <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {amortSchedule.map((row, i) => (
                      <tr
                        key={row.year}
                        className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                      >
                        <td className="py-2 font-medium text-slate-700">{row.year}</td>
                        <td className="py-2 text-right text-amber-700">{fmt(row.interest)}</td>
                        <td className="py-2 text-right text-slate-700">{fmt(row.principal)}</td>
                        <td className="py-2 text-right font-medium text-slate-900">
                          {row.balance < 1 ? '-' : fmt(row.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Stat sub-component ────────────────────────────────────────────────────────

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-0.5 text-base font-semibold ${accent ? 'text-amber-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
