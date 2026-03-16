import { useState, useMemo, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Debt {
  id: string;
  name: string;
  balance: string;
  rate: string;
  minPayment: string;
}

interface ParsedDebt {
  name: string;
  balance: number;
  rate: number;
  minPayment: number;
}

interface SimResult {
  months: number;
  totalInterest: number;
  didTimeout: boolean;
  monthlyBalances: number[];
  monthlyCumulativeInterest: number[];
}

// ─── Utilities ────────────────────────────────────────────────────────────────

let _uid = 5;
function uid() {
  return String(_uid++);
}

function parseVal(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : Math.max(0, n);
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatMonths(m: number): string {
  if (m <= 0) return '-';
  const y = Math.floor(m / 12);
  const mo = m % 12;
  if (y === 0) return `${mo} mo`;
  if (mo === 0) return `${y} yr${y !== 1 ? 's' : ''}`;
  return `${y}y ${mo}mo`;
}

// ─── Simulation ───────────────────────────────────────────────────────────────

function simulate(
  debts: ParsedDebt[],
  extraPayment: number,
  method: 'snowball' | 'avalanche',
): SimResult | null {
  const valid = debts.filter((d) => d.balance > 0 && d.minPayment > 0);
  if (valid.length === 0) return null;

  const sorted =
    method === 'snowball'
      ? [...valid].sort((a, b) => a.balance - b.balance)
      : [...valid].sort((a, b) => b.rate - a.rate);

  const balances = sorted.map((d) => d.balance);
  const monthlyRates = sorted.map((d) => d.rate / 100 / 12);
  const minPayments = sorted.map((d) => d.minPayment);
  const totalBudget = minPayments.reduce((a, b) => a + b, 0) + extraPayment;

  const monthlyBalances: number[] = [
    Math.round(balances.reduce((a, b) => a + b, 0)),
  ];
  const monthlyCumulativeInterest: number[] = [0];
  let cumulativeInterest = 0;
  let month = 0;
  const MAX_MONTHS = 600;

  while (balances.some((b) => b > 0.01) && month < MAX_MONTHS) {
    month++;

    // 1. Accrue interest
    for (let i = 0; i < balances.length; i++) {
      if (balances[i] > 0.01) {
        const interest = balances[i] * monthlyRates[i];
        balances[i] += interest;
        cumulativeInterest += interest;
      }
    }

    // 2. Find active target (first in repayment order with remaining balance)
    const targetIdx = balances.findIndex((b) => b > 0.01);

    // 3. Pay minimums on all non-target active debts
    let remainingBudget = totalBudget;
    for (let i = 0; i < balances.length; i++) {
      if (i !== targetIdx && balances[i] > 0.01) {
        const pay = Math.min(balances[i], minPayments[i]);
        balances[i] -= pay;
        remainingBudget -= pay;
        if (balances[i] < 0.01) balances[i] = 0;
      }
    }

    // 4. Apply remaining budget (extra + freed minimums) to target
    if (targetIdx >= 0 && remainingBudget > 0) {
      const pay = Math.min(balances[targetIdx], remainingBudget);
      balances[targetIdx] -= pay;
      if (balances[targetIdx] < 0.01) balances[targetIdx] = 0;
    }

    monthlyBalances.push(
      Math.round(Math.max(0, balances.reduce((a, b) => a + b, 0))),
    );
    monthlyCumulativeInterest.push(Math.round(cumulativeInterest));
  }

  return {
    months: month,
    totalInterest: Math.round(cumulativeInterest),
    didTimeout: month >= MAX_MONTHS,
    monthlyBalances,
    monthlyCumulativeInterest,
  };
}

// ─── Chart helpers ────────────────────────────────────────────────────────────

function buildChartSeries(
  snow: SimResult,
  aval: SimResult,
  chartType: 'balance' | 'interest',
) {
  const snowRaw =
    chartType === 'balance' ? snow.monthlyBalances : snow.monthlyCumulativeInterest;
  const avalRaw =
    chartType === 'balance' ? aval.monthlyBalances : aval.monthlyCumulativeInterest;

  const maxLen = Math.max(snowRaw.length, avalRaw.length);

  function pad(arr: number[], padWith: number): number[] {
    return arr.length < maxLen
      ? [...arr, ...Array(maxLen - arr.length).fill(padWith)]
      : arr;
  }

  const snowPad =
    chartType === 'balance' ? 0 : snowRaw[snowRaw.length - 1] ?? 0;
  const avalPad =
    chartType === 'balance' ? 0 : avalRaw[avalRaw.length - 1] ?? 0;

  const snowPadded = pad(snowRaw, snowPad);
  const avalPadded = pad(avalRaw, avalPad);

  const MAX_POINTS = 80;

  function sample(arr: number[]): { x: number; y: number }[] {
    const step = Math.max(1, Math.ceil(arr.length / MAX_POINTS));
    const result: { x: number; y: number }[] = [];
    for (let i = 0; i < arr.length; i += step) {
      result.push({ x: i, y: arr[i] });
    }
    const last = arr.length - 1;
    if (result[result.length - 1]?.x !== last) {
      result.push({ x: last, y: arr[last] });
    }
    return result;
  }

  return [
    { name: 'Snowball', data: sample(snowPadded) },
    { name: 'Avalanche', data: sample(avalPadded) },
  ];
}

// ─── Default data ─────────────────────────────────────────────────────────────

// Snowball order: Store Card ($1,800) → Personal Loan ($4,200) → Visa CC ($9,500) → Car Loan ($17,000)
// Avalanche order: Visa CC (28.99%) → Store Card (24.99%) → Personal Loan (13.99%) → Car Loan (7.49%)
// By delaying the 28.99% Visa for ~19 months, Snowball lets it grow well past its minimum payment,
// costing hundreds of dollars in extra interest - making the math case for Avalanche crystal clear.
const DEFAULT_DEBTS: Debt[] = [
  { id: '1', name: 'Store Credit Card', balance: '1800', rate: '24.99', minPayment: '45' },
  { id: '2', name: 'Visa Card', balance: '9500', rate: '28.99', minPayment: '190' },
  { id: '3', name: 'Car Loan', balance: '17000', rate: '7.49', minPayment: '340' },
  { id: '4', name: 'Personal Loan', balance: '4200', rate: '13.99', minPayment: '100' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface DebtRowProps {
  debt: Debt;
  index: number;
  canRemove: boolean;
  onChange: (field: keyof Debt, value: string) => void;
  onRemove: () => void;
}

function DebtRow({ debt, index, canRemove, onChange, onRemove }: DebtRowProps) {
  const inputBase =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-slate-300';
  const numberInputBase =
    'w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-900 transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-slate-300';

  const RemoveBtn = () =>
    canRemove ? (
      <button
        onClick={onRemove}
        aria-label={`Remove ${debt.name || `debt ${index + 1}`}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-300"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    ) : null;

  return (
    <>
      {/* Mobile layout */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:hidden">
        <div className="mb-2.5 flex items-center gap-2">
          <input
            type="text"
            value={debt.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder={`Debt ${index + 1} name`}
            className={`${inputBase} flex-1`}
          />
          <RemoveBtn />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Balance</span>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-slate-400">
                $
              </span>
              <input
                type="number"
                min="0"
                step="100"
                value={debt.balance}
                onChange={(e) => onChange('balance', e.target.value)}
                placeholder="0"
                className={`${numberInputBase} pl-5 pr-2`}
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Rate (%)</span>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={debt.rate}
                onChange={(e) => onChange('rate', e.target.value)}
                placeholder="0"
                className={`${numberInputBase} px-2.5`}
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-400">Min. Pmt</span>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-slate-400">
                $
              </span>
              <input
                type="number"
                min="0"
                step="5"
                value={debt.minPayment}
                onChange={(e) => onChange('minPayment', e.target.value)}
                placeholder="0"
                className={`${numberInputBase} pl-5 pr-2`}
              />
            </div>
          </label>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden items-center gap-3 sm:grid sm:grid-cols-[2fr_1.2fr_1fr_1fr_auto]">
        <input
          type="text"
          value={debt.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder={`Debt ${index + 1} name`}
          className={inputBase}
        />
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
            $
          </span>
          <input
            type="number"
            min="0"
            step="100"
            value={debt.balance}
            onChange={(e) => onChange('balance', e.target.value)}
            placeholder="0"
            className={`${numberInputBase} pl-7 pr-3`}
          />
        </div>
        <div className="relative">
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={debt.rate}
            onChange={(e) => onChange('rate', e.target.value)}
            placeholder="0"
            className={`${numberInputBase} px-3`}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
            %
          </span>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
            $
          </span>
          <input
            type="number"
            min="0"
            step="5"
            value={debt.minPayment}
            onChange={(e) => onChange('minPayment', e.target.value)}
            placeholder="0"
            className={`${numberInputBase} pl-7 pr-3`}
          />
        </div>
        <RemoveBtn />
      </div>
    </>
  );
}

interface ResultCardProps {
  method: 'snowball' | 'avalanche';
  result: SimResult;
  savingsVsOther: number;
  monthsDiffVsOther: number;
}

function ResultCard({
  method,
  result,
  savingsVsOther,
  monthsDiffVsOther,
}: ResultCardProps) {
  const isSnowball = method === 'snowball';
  const accent = isSnowball ? 'amber' : 'blue';

  const accentBg = isSnowball ? 'bg-amber-50' : 'bg-blue-50';
  const accentBorder = isSnowball ? 'border-amber-200' : 'border-blue-200';
  const accentBadge = isSnowball
    ? 'bg-amber-100 text-amber-700'
    : 'bg-blue-100 text-blue-700';
  const accentValueText = isSnowball ? 'text-amber-700' : 'text-blue-700';
  const accentIcon = isSnowball ? '🏔️' : '📊';
  const label = isSnowball ? 'Snowball' : 'Avalanche';

  return (
    <div
      className={`rounded-2xl border ${accentBorder} ${accentBg} p-5 sm:p-6`}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${accentBadge}`}
          >
            {label}
          </span>
          <h3 className="mt-1.5 font-display text-lg text-slate-900">
            {isSnowball ? 'Debt Snowball' : 'Debt Avalanche'}
          </h3>
        </div>
        <span className="text-2xl" aria-hidden>
          {accentIcon}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Paid off in
          </p>
          <p className={`text-2xl font-bold tabular-nums ${accentValueText}`}>
            {result.didTimeout ? '50+ yrs' : formatMonths(result.months)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Total interest paid
          </p>
          <p className={`text-2xl font-bold tabular-nums ${accentValueText}`}>
            {formatCurrency(result.totalInterest)}
          </p>
        </div>
      </div>

      {(savingsVsOther > 0 || monthsDiffVsOther > 0) && (
        <div className="mt-4 border-t border-current border-opacity-10 pt-4 space-y-1.5">
          {savingsVsOther > 0 && (
            <p className="text-xs text-slate-600">
              <span className="font-semibold text-emerald-600">
                Saves {formatCurrency(savingsVsOther)}
              </span>{' '}
              in interest vs {isSnowball ? 'Avalanche' : 'Snowball'}
            </p>
          )}
          {monthsDiffVsOther > 0 && (
            <p className="text-xs text-slate-600">
              <span className="font-semibold text-emerald-600">
                {monthsDiffVsOther} month{monthsDiffVsOther !== 1 ? 's' : ''} faster
              </span>{' '}
              than {isSnowball ? 'Avalanche' : 'Snowball'}
            </p>
          )}
        </div>
      )}

      {result.didTimeout && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          ⚠ Could not pay off within 50 years. Increase your monthly payment.
        </p>
      )}
    </div>
  );
}

function MethodExplanations({
  avalancheSavings,
  snowballFasterMonths,
}: {
  avalancheSavings: number;
  snowballFasterMonths: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Snowball */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg">
            🏔️
          </span>
          <div>
            <h3 className="font-display text-base text-slate-900">
              Debt Snowball
            </h3>
            <p className="text-xs text-amber-700 font-medium">Psychological momentum</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          Pay off debts from smallest balance to largest. Each time a debt is
          cleared, the freed-up payment rolls forward - like a growing snowball.
          The frequent "wins" keep you motivated and on track.
        </p>
        <div className="mt-3 rounded-xl bg-white/70 px-4 py-3">
          <p className="text-xs text-slate-500">
            ✓ Best for: <strong className="text-slate-700">motivation &amp; consistency</strong>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            ✗ Trade-off: <strong className="text-slate-700">
              {avalancheSavings > 0
                ? `pays ${formatCurrency(avalancheSavings)} more interest`
                : 'may pay slightly more interest'}
            </strong>
          </p>
        </div>
      </div>

      {/* Avalanche */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-lg">
            📊
          </span>
          <div>
            <h3 className="font-display text-base text-slate-900">
              Debt Avalanche
            </h3>
            <p className="text-xs text-blue-700 font-medium">Mathematically optimal</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          Attack debts with the highest interest rate first. This minimizes the
          total interest you pay over time, making it the most mathematically
          efficient strategy - even if it takes longer to see your first debt
          fully cleared.
        </p>
        <div className="mt-3 rounded-xl bg-white/70 px-4 py-3">
          <p className="text-xs text-slate-500">
            ✓ Best for: <strong className="text-slate-700">
              {avalancheSavings > 0
                ? `saving ${formatCurrency(avalancheSavings)} in interest`
                : 'minimizing total interest'}
            </strong>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            ✗ Trade-off: <strong className="text-slate-700">
              {snowballFasterMonths > 0
                ? `first payoff takes ${snowballFasterMonths} month${snowballFasterMonths !== 1 ? 's' : ''} longer`
                : 'slower psychological wins'}
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DebtSnowballAvalanche() {
  const [debts, setDebts] = useState<Debt[]>(DEFAULT_DEBTS);
  const [extraPayment, setExtraPayment] = useState('250');
  const [chartType, setChartType] = useState<'balance' | 'interest'>('balance');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Chart, setChart] = useState<any>(null);

  // Dynamically import ApexCharts (SSR-safe)
  useEffect(() => {
    import('react-apexcharts').then((mod) => setChart(() => mod.default));
  }, []);

  const parsedDebts = useMemo(
    () =>
      debts.map((d) => ({
        name: d.name || `Debt`,
        balance: parseVal(d.balance),
        rate: parseVal(d.rate),
        minPayment: parseVal(d.minPayment),
      })),
    [debts],
  );

  const extra = parseVal(extraPayment);

  const snowball = useMemo(
    () => simulate(parsedDebts, extra, 'snowball'),
    [parsedDebts, extra],
  );
  const avalanche = useMemo(
    () => simulate(parsedDebts, extra, 'avalanche'),
    [parsedDebts, extra],
  );

  const hasResults = !!(snowball && avalanche);
  const avalancheSavings = hasResults
    ? Math.max(0, snowball!.totalInterest - avalanche!.totalInterest)
    : 0;
  const snowballSavings = hasResults
    ? Math.max(0, avalanche!.totalInterest - snowball!.totalInterest)
    : 0;
  const snowballFasterMonths = hasResults
    ? Math.max(0, avalanche!.months - snowball!.months)
    : 0;
  const avalancheFasterMonths = hasResults
    ? Math.max(0, snowball!.months - avalanche!.months)
    : 0;

  const chartSeries = useMemo(() => {
    if (!snowball || !avalanche) return [];
    return buildChartSeries(snowball, avalanche, chartType);
  }, [snowball, avalanche, chartType]);

  const chartOptions = useMemo(
    () => ({
      chart: {
        type: 'area' as const,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'DM Sans, system-ui, sans-serif',
        background: 'transparent',
        animations: { enabled: false },
      },
      stroke: { curve: 'smooth' as const, width: [2.5, 2.5] },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.2,
          opacityTo: 0.0,
          stops: [0, 95],
        },
      },
      colors: ['#f59e0b', '#3b82f6'],
      xaxis: {
        type: 'numeric' as const,
        title: {
          text: 'Month',
          style: { fontSize: '12px', fontWeight: '500', color: '#94a3b8' },
        },
        labels: {
          formatter: (v: number) => String(Math.round(v)),
          style: { colors: '#94a3b8', fontSize: '11px' },
        },
        axisBorder: { color: '#e2e8f0' },
        axisTicks: { color: '#e2e8f0' },
      },
      yaxis: {
        labels: {
          formatter: (v: number) =>
            v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${Math.round(v)}`,
          style: { colors: '#94a3b8', fontSize: '11px' },
        },
        title: {
          text:
            chartType === 'balance'
              ? 'Remaining Balance'
              : 'Cumulative Interest Paid',
          style: { fontSize: '12px', fontWeight: '500', color: '#94a3b8' },
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        x: { formatter: (v: number) => `Month ${Math.round(v)}` },
        y: { formatter: (v: number) => formatCurrency(v) },
        theme: 'light',
      },
      legend: {
        position: 'top' as const,
        horizontalAlign: 'left' as const,
        markers: { size: 8 },
        itemMargin: { horizontal: 16 },
        fontFamily: 'DM Sans, system-ui, sans-serif',
        fontSize: '13px',
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 4,
        padding: { top: 0, right: 8, bottom: 0, left: 8 },
      },
      dataLabels: { enabled: false },
    }),
    [chartType],
  );

  const addDebt = useCallback(() => {
    setDebts((prev) => [
      ...prev,
      { id: uid(), name: '', balance: '', rate: '', minPayment: '' },
    ]);
  }, []);

  const removeDebt = useCallback((id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const updateDebt = useCallback(
    (id: string, field: keyof Debt, value: string) => {
      setDebts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
      );
    },
    [],
  );

  const totalMinPayments = parsedDebts.reduce(
    (a, d) => a + (d.minPayment > 0 ? d.minPayment : 0),
    0,
  );
  const totalBudget = totalMinPayments + extra;
  const activeDebtCount = parsedDebts.filter((d) => d.balance > 0).length;

  return (
    <div className="space-y-6">
      {/* ── Debt Input ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl text-slate-900">Your Debts</h2>
          {activeDebtCount > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 tabular-nums">
              {activeDebtCount} debt{activeDebtCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Desktop column headers */}
        <div className="mb-2 hidden grid-cols-[2fr_1.2fr_1fr_1fr_auto] gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:grid">
          <span>Debt Name</span>
          <span>Balance</span>
          <span>Interest Rate</span>
          <span>Min. Payment</span>
          <span className="sr-only">Remove</span>
        </div>

        <div className="space-y-2.5 sm:space-y-2">
          {debts.map((debt, idx) => (
            <DebtRow
              key={debt.id}
              debt={debt}
              index={idx}
              canRemove={debts.length > 1}
              onChange={(field, value) => updateDebt(debt.id, field, value)}
              onRemove={() => removeDebt(debt.id)}
            />
          ))}
        </div>

        <button
          onClick={addDebt}
          className="mt-4 flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium text-amber-600 transition-colors hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 5v14m-7-7h14"
            />
          </svg>
          Add another debt
        </button>

        {/* Extra Payment */}
        <div className="mt-5 border-t border-slate-100 pt-5">
          <label
            htmlFor="extra-payment"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Extra Monthly Payment
            <span className="ml-1.5 text-xs font-normal text-slate-400">
              (on top of all minimums)
            </span>
          </label>
          <div className="relative w-full sm:w-56">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              $
            </span>
            <input
              id="extra-payment"
              type="number"
              min="0"
              step="10"
              value={extraPayment}
              onChange={(e) => setExtraPayment(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-7 pr-3 text-sm text-slate-900 transition focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="200"
            />
          </div>
          {totalBudget > 0 && (
            <p className="mt-1.5 text-xs text-slate-400">
              Total monthly payment:{' '}
              <strong className="text-slate-600">
                {formatCurrency(totalBudget)}
              </strong>{' '}
              <span className="text-slate-300">&middot;</span> minimums:{' '}
              {formatCurrency(totalMinPayments)} + extra: {formatCurrency(extra)}
            </p>
          )}
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {hasResults ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <ResultCard
              method="snowball"
              result={snowball!}
              savingsVsOther={snowballSavings}
              monthsDiffVsOther={snowballFasterMonths}
            />
            <ResultCard
              method="avalanche"
              result={avalanche!}
              savingsVsOther={avalancheSavings}
              monthsDiffVsOther={avalancheFasterMonths}
            />
          </div>

          {/* Winner Banner */}
          {(avalancheSavings > 0 || snowballFasterMonths > 0) && (
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white sm:p-6">
              <h3 className="font-display text-lg">Strategy Comparison</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {avalancheSavings > 0 && (
                  <div className="flex items-start gap-3 rounded-xl bg-white/10 p-3">
                    <span className="mt-0.5 text-blue-400">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs text-white/60 font-medium uppercase tracking-wide">
                        Avalanche saves
                      </p>
                      <p className="text-lg font-bold text-blue-300">
                        {formatCurrency(avalancheSavings)}
                      </p>
                      <p className="text-xs text-white/50">in total interest</p>
                    </div>
                  </div>
                )}
                {snowballFasterMonths > 0 && (
                  <div className="flex items-start gap-3 rounded-xl bg-white/10 p-3">
                    <span className="mt-0.5 text-amber-400">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs text-white/60 font-medium uppercase tracking-wide">
                        Snowball is faster
                      </p>
                      <p className="text-lg font-bold text-amber-300">
                        {snowballFasterMonths} mo{snowballFasterMonths !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-white/50">sooner debt-free</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-white/40">
                {avalancheSavings > 0 && snowballFasterMonths === 0
                  ? 'Avalanche is the clear winner - it finishes faster and saves more money.'
                  : avalancheSavings === 0 && snowballFasterMonths > 0
                    ? 'Snowball gets you debt-free sooner - great for staying motivated.'
                    : 'These numbers show the classic trade-off: save money (Avalanche) vs. stay motivated (Snowball).'}
              </p>
            </div>
          )}

          {/* Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-xl text-slate-900">
                Repayment Timeline
              </h2>
              <div className="flex overflow-hidden rounded-xl border border-slate-200 text-sm">
                <button
                  onClick={() => setChartType('balance')}
                  className={`flex-1 px-4 py-2 font-medium transition-colors focus:outline-none ${
                    chartType === 'balance'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Balance
                </button>
                <button
                  onClick={() => setChartType('interest')}
                  className={`flex-1 px-4 py-2 font-medium transition-colors focus:outline-none ${
                    chartType === 'interest'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Interest Paid
                </button>
              </div>
            </div>

            {Chart ? (
              <Chart
                type="area"
                series={chartSeries}
                options={chartOptions}
                height={300}
              />
            ) : (
              <div className="flex h-72 items-center justify-center text-sm text-slate-300">
                Loading chart...
              </div>
            )}

            <p className="mt-1 text-center text-xs text-slate-400">
              {chartType === 'balance'
                ? 'Total remaining debt balance each month. As debts are eliminated, freed payments accelerate the remaining balances.'
                : 'Cumulative interest paid over time. The strategy whose line ends lower saves you the most money.'}
            </p>
          </div>

          {/* Method Explanations */}
          <MethodExplanations
            avalancheSavings={avalancheSavings}
            snowballFasterMonths={snowballFasterMonths}
          />
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-sm text-slate-400">
            Enter at least one debt with a balance and minimum payment above
            zero to see your repayment comparison.
          </p>
        </div>
      )}
    </div>
  );
}
