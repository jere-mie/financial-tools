import { useState, type ChangeEvent, type FormEvent } from 'react';

interface FormData {
  annualIncome: string;
  yearsToReplace: string;
  mortgage: string;
  otherDebts: string;
  finalExpenses: string;
  educationFund: string;
  existingCoverage: string;
  liquidAssets: string;
}

interface Results {
  incomeReplacement: number;
  debtCoverage: number;
  finalExpenses: number;
  educationFund: number;
  totalNeeds: number;
  existingCoverage: number;
  liquidAssets: number;
  recommendedCoverage: number;
}

const defaultForm: FormData = {
  annualIncome: '',
  yearsToReplace: '10',
  mortgage: '',
  otherDebts: '',
  finalExpenses: '15000',
  educationFund: '',
  existingCoverage: '',
  liquidAssets: '',
};

function parseNum(val: string): number {
  const n = parseFloat(val.replace(/,/g, ''));
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

function calculate(form: FormData): Results {
  const income = parseNum(form.annualIncome);
  const years = parseNum(form.yearsToReplace);
  const mortgage = parseNum(form.mortgage);
  const otherDebts = parseNum(form.otherDebts);
  const finalExpenses = parseNum(form.finalExpenses);
  const educationFund = parseNum(form.educationFund);
  const existingCoverage = parseNum(form.existingCoverage);
  const liquidAssets = parseNum(form.liquidAssets);

  const incomeReplacement = income * years;
  const debtCoverage = mortgage + otherDebts;
  const totalNeeds = incomeReplacement + debtCoverage + finalExpenses + educationFund;
  const recommendedCoverage = Math.max(0, totalNeeds - existingCoverage - liquidAssets);

  return {
    incomeReplacement,
    debtCoverage,
    finalExpenses,
    educationFund,
    totalNeeds,
    existingCoverage,
    liquidAssets,
    recommendedCoverage,
  };
}

function InputField({
  label,
  name,
  value,
  onChange,
  hint,
  prefix = '$',
}: {
  label: string;
  name: keyof FormData;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
  prefix?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      <div className="relative mt-1.5">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            {prefix}
          </span>
        )}
        <input
          id={name}
          name={name}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={onChange}
          placeholder="0"
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-3 text-sm text-slate-800 transition-colors placeholder:text-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          style={{ paddingLeft: prefix ? '1.75rem' : '0.75rem' }}
        />
      </div>
    </div>
  );
}

function ResultRow({ label, amount, highlight }: { label: string; amount: number; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${highlight ? 'border-t-2 border-slate-900 pt-3' : ''}`}>
      <span className={`text-sm ${highlight ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-sm tabular-nums ${highlight ? 'font-bold text-slate-900 text-base' : 'font-medium text-slate-800'}`}>
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

export default function LifeInsuranceCalculator() {
  const [form, setForm] = useState<FormData>(defaultForm);
  const [results, setResults] = useState<Results | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setResults(calculate(form));
  }

  function handleReset() {
    setForm(defaultForm);
    setResults(null);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8 lg:col-span-3">
        {/* Income Section */}
        <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <legend className="px-2 font-display text-lg text-slate-900">Income Replacement</legend>
          <div className="mt-2 grid gap-5 sm:grid-cols-2 sm:items-end">
            <InputField
              label="Annual gross income"
              name="annualIncome"
              value={form.annualIncome}
              onChange={handleChange}
              hint="Your yearly income before taxes"
            />
            <InputField
              label="Years to replace income"
              name="yearsToReplace"
              value={form.yearsToReplace}
              onChange={handleChange}
              hint="How long your family would need support"
              prefix=""
            />
          </div>
        </fieldset>

        {/* Debts Section */}
        <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <legend className="px-2 font-display text-lg text-slate-900">Debts &amp; Obligations</legend>
          <div className="mt-2 grid gap-5 sm:grid-cols-2 sm:items-end">
            <InputField
              label="Outstanding mortgage"
              name="mortgage"
              value={form.mortgage}
              onChange={handleChange}
              hint="Remaining balance on your mortgage"
            />
            <InputField
              label="Other debts"
              name="otherDebts"
              value={form.otherDebts}
              onChange={handleChange}
              hint="Car loans, credit cards, student loans, etc."
            />
          </div>
        </fieldset>

        {/* Additional Needs */}
        <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <legend className="px-2 font-display text-lg text-slate-900">Additional Needs</legend>
          <div className="mt-2 grid gap-5 sm:grid-cols-2 sm:items-end">
            <InputField
              label="Final expenses"
              name="finalExpenses"
              value={form.finalExpenses}
              onChange={handleChange}
              hint="Funeral, legal fees, etc."
            />
            <InputField
              label="Children's education fund"
              name="educationFund"
              value={form.educationFund}
              onChange={handleChange}
              hint="Total amount for children's education"
            />
          </div>
        </fieldset>

        {/* Existing Resources */}
        <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <legend className="px-2 font-display text-lg text-slate-900">Existing Resources</legend>
          <div className="mt-2 grid gap-5 sm:grid-cols-2 sm:items-end">
            <InputField
              label="Current life insurance coverage"
              name="existingCoverage"
              value={form.existingCoverage}
              onChange={handleChange}
              hint="Through employer or existing policies"
            />
            <InputField
              label="Liquid assets &amp; savings"
              name="liquidAssets"
              value={form.liquidAssets}
              onChange={handleChange}
              hint="Savings, investments, etc."
            />
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 active:scale-[0.98]"
          >
            Calculate Coverage
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Results Panel */}
      <div className="lg:col-span-2">
        <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-display text-lg text-slate-900">Estimated Coverage Needed</h2>

          {results === null ? (
            <div className="mt-6 flex flex-col items-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Fill in the form and click <strong>Calculate Coverage</strong> to see your results.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-1">
              <p className="mb-3 text-xs font-medium tracking-wide text-slate-400 uppercase">Needs</p>
              <ResultRow label="Income replacement" amount={results.incomeReplacement} />
              <ResultRow label="Debt coverage" amount={results.debtCoverage} />
              <ResultRow label="Final expenses" amount={results.finalExpenses} />
              <ResultRow label="Education fund" amount={results.educationFund} />

              <div className="!mt-3 border-t border-slate-100 pt-1">
                <ResultRow label="Total needs" amount={results.totalNeeds} />
              </div>

              <p className="!mt-4 mb-3 text-xs font-medium tracking-wide text-slate-400 uppercase">Less existing resources</p>
              <ResultRow label="Current coverage" amount={results.existingCoverage} />
              <ResultRow label="Liquid assets" amount={results.liquidAssets} />

              <div className="!mt-4">
                <ResultRow label="Recommended coverage" amount={results.recommendedCoverage} highlight />
              </div>

              <div className="!mt-5 rounded-lg bg-amber-50 p-3">
                <p className="text-xs leading-relaxed text-amber-800">
                  <strong>Tip:</strong> A common rule of thumb is 10-15x your annual income. Your calculated need is{' '}
                  {parseNum(form.annualIncome) > 0
                    ? `${(results.recommendedCoverage / parseNum(form.annualIncome)).toFixed(1)}x your income`
                    : 'not calculable without an income value'}
                  .
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
