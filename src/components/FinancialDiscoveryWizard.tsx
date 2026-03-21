import { useState, useCallback, useRef, createContext, useContext } from 'react';

const RowContext = createContext(false);

// ─── Types ────────────────────────────────────────────────────────────────────

interface Dependent { name: string; dob: string }

interface LifePolicy {
  id: string;
  type: 'term' | 'whole' | 'universal' | 'group';
  insured: 'primary' | 'partner' | 'joint';
  deathBenefit: string;
  beneficiary: string;
}

interface FormState {
  // Step 1 - Contact
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;

  // Step 1 - Household
  primaryName: string;
  primaryDOB: string;
  partnerName: string;
  partnerDOB: string;
  dependents: Dependent[];
  planningResp: boolean;
  respBalance: string;
  respMonthlyContrib: string;

  // Step 2 - Assets (Primary)
  rrspBalance: string;
  spousalRrspBalance: string;
  tfsaBalance: string;
  tfsaContribRoom: string;
  fhsaBalance: string;

  // Step 2 - Assets (Partner - shown when partner name is set)
  partnerRrspBalance: string;
  partnerTfsaBalance: string;
  partnerTfsaContribRoom: string;
  partnerFhsaBalance: string;

  // Step 2 - Assets (Shared / Non-Registered)
  hisaBalance: string;
  nonRegBalance: string;
  primaryResidenceValue: string;
  secondaryPropertyValue: string;

  // Step 2 - Pension (Primary)
  pensionType: 'none' | 'DB' | 'DC';
  dbAnnualBridge: string;
  dbLifetimePension: string;
  dcBalance: string;

  // Step 2 - Pension (Partner)
  partnerPensionType: 'none' | 'DB' | 'DC';
  partnerDbAnnualBridge: string;
  partnerDbLifetimePension: string;
  partnerDcBalance: string;

  // Step 3 - Liabilities
  housingStatus: 'rent' | 'own';
  mortgageBalance: string;
  mortgageRate: string;
  mortgageTermExpiry: string;
  mortgageMonthly: string;
  helocBalance: string;
  osapBalance: string;
  creditCardBalance: string;
  creditCardAPR: string;
  vehicleBalance: string;

  // Step 4 - Protection
  lifePolicies: LifePolicy[];
  hasEmployerHealth: boolean;
  hasLTD: boolean;
  hasCriticalIllness: boolean;
  partnerHasEmployerHealth: boolean;
  partnerHasLTD: boolean;
  partnerHasCriticalIllness: boolean;

  // Step 5 - Income
  annualGrossIncome: string;
  incomeType: 'T4' | 'self-employed' | 'rental' | 'mixed';
  partnerAnnualGrossIncome: string;
  partnerIncomeType: 'T4' | 'self-employed' | 'rental' | 'mixed';

  // Notes & open state
  notes: Record<string, string>;
  notesOpen: Record<string, boolean>;
}

const INITIAL: FormState = {
  phone: '', email: '', address: '', city: '', postalCode: '',
  primaryName: '', primaryDOB: '',
  partnerName: '', partnerDOB: '',
  dependents: [],
  planningResp: false, respBalance: '', respMonthlyContrib: '',
  rrspBalance: '', spousalRrspBalance: '',
  tfsaBalance: '', tfsaContribRoom: '',
  fhsaBalance: '',
  partnerRrspBalance: '', partnerTfsaBalance: '', partnerTfsaContribRoom: '',
  partnerFhsaBalance: '',
  hisaBalance: '', nonRegBalance: '',
  primaryResidenceValue: '', secondaryPropertyValue: '',
  pensionType: 'none', dbAnnualBridge: '', dbLifetimePension: '', dcBalance: '',
  partnerPensionType: 'none', partnerDbAnnualBridge: '', partnerDbLifetimePension: '', partnerDcBalance: '',
  housingStatus: 'own',
  mortgageBalance: '', mortgageRate: '', mortgageTermExpiry: '', mortgageMonthly: '',
  helocBalance: '', osapBalance: '',
  creditCardBalance: '', creditCardAPR: '', vehicleBalance: '',
  lifePolicies: [],
  hasEmployerHealth: false, hasLTD: false, hasCriticalIllness: false,
  partnerHasEmployerHealth: false, partnerHasLTD: false, partnerHasCriticalIllness: false,
  annualGrossIncome: '', incomeType: 'T4',
  partnerAnnualGrossIncome: '', partnerIncomeType: 'T4',
  notes: {}, notesOpen: {},
};

// ─── Dev: Sample Data ─────────────────────────────────────────────────────────
// Set DEV_AUTOFILL to true to skip manual data entry during development.
// Flip back to false before committing / deploying.
const DEV_AUTOFILL = true;

const SAMPLE: FormState = {
  phone: '(416) 555-0192', email: 'jordan.chen@email.com',
  address: '142 Oakwood Avenue', city: 'Toronto', postalCode: 'M6E 2V9',
  primaryName: 'Jordan Chen', primaryDOB: '1987-04-15',
  partnerName: 'Alex Chen', partnerDOB: '1989-09-22',
  dependents: [{ name: 'Lily Chen', dob: '2018-06-10' }, { name: 'Noah Chen', dob: '2021-02-28' }],
  planningResp: true, respBalance: '18500', respMonthlyContrib: '150',
  rrspBalance: '94000', spousalRrspBalance: '22000',
  tfsaBalance: '41000', tfsaContribRoom: '18500',
  fhsaBalance: '8000',
  partnerRrspBalance: '61000', partnerTfsaBalance: '29000', partnerTfsaContribRoom: '22000',
  partnerFhsaBalance: '0',
  hisaBalance: '24000', nonRegBalance: '15000',
  primaryResidenceValue: '875000', secondaryPropertyValue: '0',
  pensionType: 'DB', dbAnnualBridge: '8400', dbLifetimePension: '36000', dcBalance: '',
  partnerPensionType: 'DC', partnerDbAnnualBridge: '', partnerDbLifetimePension: '', partnerDcBalance: '48000',
  housingStatus: 'own',
  mortgageBalance: '412000', mortgageRate: '5.49', mortgageTermExpiry: '2027-11-01', mortgageMonthly: '2650',
  helocBalance: '0', osapBalance: '9200',
  creditCardBalance: '4800', creditCardAPR: '19.99', vehicleBalance: '18500',
  lifePolicies: [
    { id: 'sample-1', type: 'term', insured: 'primary', deathBenefit: '750000', beneficiary: 'Alex Chen' },
    { id: 'sample-2', type: 'group', insured: 'partner', deathBenefit: '120000', beneficiary: 'Jordan Chen' },
  ],
  hasEmployerHealth: true, hasLTD: true, hasCriticalIllness: false,
  partnerHasEmployerHealth: true, partnerHasLTD: false, partnerHasCriticalIllness: false,
  annualGrossIncome: '128000', incomeType: 'T4',
  partnerAnnualGrossIncome: '96000', partnerIncomeType: 'T4',
  notes: {
    rrspBalance: 'Transferred from group RRSP when leaving previous employer in 2023.',
    mortgageBalance: 'Variable converted to fixed at renewal - reviewing options in early 2027.',
    creditCardBalance: 'One card carries balance month-to-month; working to pay off by year-end.',
  },
  notesOpen: { rrspBalance: true, mortgageBalance: true, creditCardBalance: true },
};

const TOTAL_STEPS = 6; // 1-6 (0 = welcome)

// ─── Formatting ───────────────────────────────────────────────────────────────

function parseDollar(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
}

function calcAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return isNaN(age) ? null : age;
}

// ─── Derived Metrics ──────────────────────────────────────────────────────────

function computeMetrics(f: FormState) {
  const totalRegistered =
    parseDollar(f.rrspBalance) +
    parseDollar(f.spousalRrspBalance) +
    parseDollar(f.partnerRrspBalance) +
    parseDollar(f.tfsaBalance) +
    parseDollar(f.partnerTfsaBalance) +
    parseDollar(f.fhsaBalance) +
    parseDollar(f.partnerFhsaBalance) +
    (f.pensionType === 'DC' ? parseDollar(f.dcBalance) : 0) +
    (f.partnerPensionType === 'DC' ? parseDollar(f.partnerDcBalance) : 0);

  const totalNonReg =
    parseDollar(f.hisaBalance) + parseDollar(f.nonRegBalance);

  const totalRealEstate =
    parseDollar(f.primaryResidenceValue) + parseDollar(f.secondaryPropertyValue);

  const resp = parseDollar(f.respBalance);

  const totalAssets = totalRegistered + totalNonReg + totalRealEstate + resp;

  const mortgage = parseDollar(f.mortgageBalance);
  const heloc = parseDollar(f.helocBalance);
  const osap = parseDollar(f.osapBalance);
  const creditCard = parseDollar(f.creditCardBalance);
  const vehicle = parseDollar(f.vehicleBalance);
  const totalLiabilities = mortgage + heloc + osap + creditCard + vehicle;

  const netWorth = totalAssets - totalLiabilities;

  const monthlyDebt =
    parseDollar(f.mortgageMonthly) +
    (creditCard > 0 ? creditCard * 0.02 : 0); // estimate min payment

  const lifeInsurance = f.lifePolicies.reduce((sum, p) => sum + parseDollar(p.deathBenefit), 0);
  const annualIncome = parseDollar(f.annualGrossIncome) + parseDollar(f.partnerAnnualGrossIncome);
  const recommendedInsurance = annualIncome * 10;
  const insuranceGap = recommendedInsurance - lifeInsurance;

  const tfsaRoom = parseDollar(f.tfsaContribRoom) + parseDollar(f.partnerTfsaContribRoom);

  const respMonthly = parseDollar(f.respMonthlyContrib);
  const cegsBenchmark = 2500; // annual contribution needed for max CESG ($500/yr)

  return {
    totalAssets, totalLiabilities, netWorth,
    totalRegistered, totalNonReg, totalRealEstate, resp,
    mortgage, heloc, osap, creditCard, vehicle,
    monthlyDebt, lifeInsurance, annualIncome,
    recommendedInsurance, insuranceGap,
    tfsaRoom, respMonthly, cegsBenchmark,
  };
}

// ─── Design tokens (matches site palette) ────────────────────────────────────

const C = {
  bg:           '#f8fafc',   // slate-50
  card:         '#ffffff',
  border:       '#e2e8f0',   // slate-200
  borderFocus:  '#f59e0b',   // amber-500
  amber:        '#d97706',   // amber-600
  amberDark:    '#b45309',   // amber-700
  amberLight:   '#fef3c7',   // amber-100
  amberMid:     '#fde68a',   // amber-200
  text:         '#0f172a',   // slate-900
  body:         '#334155',   // slate-700
  muted:        '#64748b',   // slate-500
  dim:          '#94a3b8',   // slate-400
  dimBg:        '#f1f5f9',   // slate-100
  green:        '#059669',   // emerald-600
  greenBg:      '#d1fae5',   // emerald-100
  red:          '#dc2626',   // red-600
  redBg:        '#fee2e2',   // red-100
} as const;

const inputStyle: React.CSSProperties = {
  background: '#ffffff',
  border: `1.5px solid ${C.border}`,
  color: C.text,
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
};

// ─── NoteProps interface ──────────────────────────────────────────────────────

interface NoteProps {
  notes: Record<string, string>;
  notesOpen: Record<string, boolean>;
  onNoteToggle: (key: string) => void;
  onNoteChange: (key: string, val: string) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldProps extends NoteProps {
  label: string;
  fieldKey: string;
  children: React.ReactNode;
  hint?: string;
  notePlaceholder?: string;
}

function Field({ label, fieldKey, notes, notesOpen, onNoteToggle, onNoteChange, children, hint, notePlaceholder }: FieldProps) {
  const open = notesOpen[fieldKey] ?? false;
  const inRow = useContext(RowContext);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '4px' }}>
        <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted }}>
          {label}
        </label>
        <button
          type="button"
          onClick={() => onNoteToggle(fieldKey)}
          style={{
            fontSize: '11px', color: open ? C.amber : C.dim, cursor: 'pointer',
            background: 'none', border: 'none', padding: '0 0 0 8px', letterSpacing: '0.03em',
            transition: 'color 0.15s', flexShrink: 0,
          }}
        >
          {open ? '− hide note' : '+ add note'}
        </button>
      </div>
      {/* Hint - fixed height inside Row for alignment; auto height standalone */}
      {(inRow || hint) && (
        <div style={{ height: inRow ? '34px' : 'auto', marginBottom: '5px', overflow: 'hidden' }}>
          {hint && <span style={{ fontSize: '11px', color: C.dim, lineHeight: 1.4 }}>{hint}</span>}
        </div>
      )}
      {children}
      {open && (
        <textarea
          value={notes[fieldKey] ?? ''}
          onChange={e => onNoteChange(fieldKey, e.target.value)}
          placeholder={notePlaceholder ?? 'Add a contextual note...'}
          rows={2}
          style={{
            ...inputStyle,
            marginTop: '8px',
            resize: 'vertical',
            fontSize: '13px',
            color: C.amberDark,
            borderColor: C.amberMid,
            background: C.amberLight,
          }}
        />
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputStyle,
        borderColor: focused ? C.borderFocus : C.border,
        boxShadow: focused ? `0 0 0 3px rgba(245,158,11,0.12)` : 'none',
      }}
    />
  );
}

function MoneyInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
        color: focused ? C.amber : C.dim,
        fontSize: '14px', pointerEvents: 'none', transition: 'color 0.15s', fontWeight: 500,
      }}>$</span>
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? '0'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle, paddingLeft: '26px',
          borderColor: focused ? C.borderFocus : C.border,
          boxShadow: focused ? `0 0 0 3px rgba(245,158,11,0.12)` : 'none',
        }}
      />
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textAlign: 'left' }}
    >
      <span style={{
        display: 'inline-block', width: '42px', height: '22px',
        borderRadius: '11px',
        background: checked ? C.amber : C.border,
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute', top: '3px', left: checked ? '21px' : '3px',
          width: '16px', height: '16px', borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </span>
      <span style={{ fontSize: '14px', color: C.body, lineHeight: 1.4 }}>{label}</span>
    </button>
  );
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle, appearance: 'none',
          borderColor: focused ? C.borderFocus : C.border,
          boxShadow: focused ? `0 0 0 3px rgba(245,158,11,0.12)` : 'none',
          paddingRight: '36px', cursor: 'pointer',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: C.dim, pointerEvents: 'none', fontSize: '12px' }}>▾</span>
    </div>
  );
}

function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="wizard-card" style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: '16px', marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
    }}>
      {title && (
        <h3 style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: '18px', fontWeight: 400, color: C.text,
          marginBottom: '20px', letterSpacing: '-0.01em',
        }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

// Row: align-items: start so hint-less fields don't push adjacent inputs down
// RowContext lets Field know it's inside a Row and should reserve hint space for alignment
function Row({ children }: { children: React.ReactNode }) {
  return (
    <RowContext.Provider value={true}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        alignItems: 'start',
        marginBottom: '16px',
      }}>
        {children}
      </div>
    </RowContext.Provider>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────────

function Step1Household({ f, set, noteProps }: { f: FormState; set: (u: Partial<FormState>) => void; noteProps: NoteProps }) {
  return (
    <div className="wizard-step-enter">
      <Card title="Contact Information">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <Field label="Phone" fieldKey="phone" {...noteProps}
            notePlaceholder="e.g. Best reached weekday afternoons">
            <TextInput value={f.phone} onChange={v => set({ phone: v })} placeholder="(416) 555-0100" />
          </Field>
          <Field label="Email" fieldKey="email" {...noteProps}
            notePlaceholder="e.g. Prefers email for initial contact">
            <TextInput type="email" value={f.email} onChange={v => set({ email: v })} placeholder="name@email.com" />
          </Field>
        </div>
        <Field label="Street Address" fieldKey="address" {...noteProps}
          notePlaceholder="e.g. Currently renting - planning to purchase within 2 years">
          <TextInput value={f.address} onChange={v => set({ address: v })} placeholder="123 Main Street" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
          <Field label="City" fieldKey="city" {...noteProps}
            notePlaceholder="">
            <TextInput value={f.city} onChange={v => set({ city: v })} placeholder="Toronto" />
          </Field>
          <Field label="Postal Code" fieldKey="postalCode" {...noteProps}
            notePlaceholder="">
            <TextInput value={f.postalCode} onChange={v => set({ postalCode: v })} placeholder="M5V 2T6" />
          </Field>
        </div>
      </Card>

      <Card title="Primary Applicant">
        <Row>
          <Field label="Full Name" fieldKey="primaryName" {...noteProps}
            notePlaceholder="e.g. Common-law partners since 2015">
            <TextInput value={f.primaryName} onChange={v => set({ primaryName: v })} placeholder="Jane Smith" />
          </Field>
          <Field label="Date of Birth" fieldKey="primaryDOB" {...noteProps}
            notePlaceholder="e.g. Planning to retire at 60"
            hint={f.primaryDOB ? `Age: ${calcAge(f.primaryDOB) ?? '-'}` : undefined}>
            <TextInput type="date" value={f.primaryDOB} onChange={v => set({ primaryDOB: v })} />
          </Field>
        </Row>
      </Card>

      <Card title="Spouse / Partner (optional)">
        <Row>
          <Field label="Full Name" fieldKey="partnerName" {...noteProps}
            notePlaceholder="e.g. Partner has a separate will">
            <TextInput value={f.partnerName} onChange={v => set({ partnerName: v })} placeholder="John Smith" />
          </Field>
          <Field label="Date of Birth" fieldKey="partnerDOB" {...noteProps}
            notePlaceholder="e.g. Partner planning parental leave in 2027"
            hint={f.partnerDOB ? `Age: ${calcAge(f.partnerDOB) ?? '-'}` : undefined}>
            <TextInput type="date" value={f.partnerDOB} onChange={v => set({ partnerDOB: v })} />
          </Field>
        </Row>
      </Card>

      <Card title="Dependents">
        {f.dependents.map((dep, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: C.muted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Name</label>
              <TextInput value={dep.name} onChange={v => { const d = [...f.dependents]; d[i] = { ...d[i], name: v }; set({ dependents: d }); }} placeholder="Child name" />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: C.muted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>DOB</label>
              <TextInput type="date" value={dep.dob} onChange={v => { const d = [...f.dependents]; d[i] = { ...d[i], dob: v }; set({ dependents: d }); }} />
            </div>
            <button type="button" onClick={() => set({ dependents: f.dependents.filter((_, j) => j !== i) })}
              style={{ background: 'none', border: `1px solid ${C.dim}`, color: C.muted, borderRadius: '8px', padding: '9px 12px', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>
              ×
            </button>
          </div>
        ))}
        <button type="button"
          onClick={() => set({ dependents: [...f.dependents, { name: '', dob: '' }] })}
          style={{ fontSize: '13px', color: C.amber, background: 'none', border: `1px dashed ${C.amberMid}`, borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', width: '100%', transition: 'border-color 0.2s' }}>
          + Add Dependent
        </button>
      </Card>

      <Card title="Education Planning (RESP)">
        <div style={{ marginBottom: '16px' }}>
          <Toggle checked={f.planningResp} onChange={v => set({ planningResp: v })} label="Planning for post-secondary education" />
        </div>
        {f.planningResp && (
          <Row>
            <Field label="Current RESP Balance" fieldKey="respBalance" {...noteProps}
              notePlaceholder="e.g. Opened in 2018 for Emma's university">
              <MoneyInput value={f.respBalance} onChange={v => set({ respBalance: v })} />
            </Field>
            <Field label="Monthly Contribution" fieldKey="respMonthlyContrib" {...noteProps}
              notePlaceholder="e.g. Planning to increase when daycare ends in 2027"
              hint="Contribute $208/month to maximize the 20% CESG grant ($500/yr)">
              <MoneyInput value={f.respMonthlyContrib} onChange={v => set({ respMonthlyContrib: v })} />
            </Field>
          </Row>
        )}
      </Card>
    </div>
  );
}

// ─── PensionFields: reusable pension block for one person ─────────────────────

interface PensionFieldsProps {
  pensionType: 'none' | 'DB' | 'DC';
  onPensionType: (v: 'none' | 'DB' | 'DC') => void;
  bridge: string; onBridge: (v: string) => void;
  lifetime: string; onLifetime: (v: string) => void;
  dc: string; onDc: (v: string) => void;
  noteProps: NoteProps;
  notePrefix: string; // '' for primary, 'partner' for partner
}

function PensionFields({ pensionType, onPensionType, bridge, onBridge, lifetime, onLifetime, dc, onDc, noteProps, notePrefix }: PensionFieldsProps) {
  const k = (key: string) => notePrefix
    ? `${notePrefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`
    : key;
  return (
    <>
      <Field label="Pension Type" fieldKey={k('pensionType')} {...noteProps}
        notePlaceholder="e.g. Government of Ontario, 30 years of projected service">
        <Select
          value={pensionType}
          onChange={v => onPensionType(v as 'none' | 'DB' | 'DC')}
          options={[
            { value: 'none', label: 'No Pension' },
            { value: 'DB', label: 'Defined Benefit (DB)' },
            { value: 'DC', label: 'Defined Contribution (DC)' },
          ]}
        />
      </Field>
      {pensionType === 'DB' && (
        <div style={{ marginTop: '16px' }}>
          <Row>
            <Field label="Est. Annual Bridge Benefit" fieldKey={k('dbAnnualBridge')} {...noteProps}
              notePlaceholder="e.g. Bridge benefit ends at age 65 when CPP begins">
              <MoneyInput value={bridge} onChange={onBridge} />
            </Field>
            <Field label="Est. Annual Lifetime Pension" fieldKey={k('dbLifetimePension')} {...noteProps}
              notePlaceholder="e.g. Indexed to CPI, survivor benefit at 60%">
              <MoneyInput value={lifetime} onChange={onLifetime} />
            </Field>
          </Row>
        </div>
      )}
      {pensionType === 'DC' && (
        <div style={{ marginTop: '16px' }}>
          <Field label="Current DC Pension Balance" fieldKey={k('dcBalance')} {...noteProps}
            notePlaceholder="e.g. Balanced fund, employer matches 5% of salary">
            <MoneyInput value={dc} onChange={onDc} />
          </Field>
        </div>
      )}
    </>
  );
}

function Step2Assets({ f, set, noteProps }: { f: FormState; set: (u: Partial<FormState>) => void; noteProps: NoteProps }) {
  const hasPartner = !!f.partnerName;
  const pName = f.primaryName || 'Primary Applicant';
  const qName = f.partnerName;

  const subHeader = (name: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '14px' }}>
      <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: C.amber, flexShrink: 0 }} />
      <span style={{ fontSize: '12px', fontWeight: 700, color: C.text, letterSpacing: '0.02em' }}>{name}</span>
    </div>
  );

  return (
    <div className="wizard-step-enter">
      <Card title="Registered Accounts">
        {hasPartner ? (
          <>
            {subHeader(pName)}
            <Row>
              <Field label="RRSP Balance" fieldKey="rrspBalance" {...noteProps}
                notePlaceholder="e.g. Includes in-kind transfer from previous employer">
                <MoneyInput value={f.rrspBalance} onChange={v => set({ rrspBalance: v })} />
              </Field>
              <Field label="TFSA Balance" fieldKey="tfsaBalance" {...noteProps}
                notePlaceholder="e.g. Mix of GICs and broad-market ETFs">
                <MoneyInput value={f.tfsaBalance} onChange={v => set({ tfsaBalance: v })} />
              </Field>
            </Row>
            <Row>
              <Field label="TFSA Contribution Room" fieldKey="tfsaContribRoom" {...noteProps}
                notePlaceholder="e.g. Verified via CRA My Account in March 2026"
                hint="Check CRA My Account for exact room">
                <MoneyInput value={f.tfsaContribRoom} onChange={v => set({ tfsaContribRoom: v })} />
              </Field>
              <Field label="FHSA Balance" fieldKey="fhsaBalance" {...noteProps}
                notePlaceholder="e.g. Opened 2023, targeting home purchase within 5 years"
                hint="First Home Savings Account">
                <MoneyInput value={f.fhsaBalance} onChange={v => set({ fhsaBalance: v })} />
              </Field>
            </Row>
            <div style={{ height: '1px', background: C.border, margin: '4px 0 20px' }} />
            {subHeader(qName)}
            <Row>
              <Field label="RRSP Balance" fieldKey="partnerRrspBalance" {...noteProps}
                notePlaceholder="e.g. Considering spousal RRSP contributions for income-splitting">
                <MoneyInput value={f.partnerRrspBalance} onChange={v => set({ partnerRrspBalance: v })} />
              </Field>
              <Field label="TFSA Balance" fieldKey="partnerTfsaBalance" {...noteProps}
                notePlaceholder="e.g. Mix of GICs and broad-market ETFs">
                <MoneyInput value={f.partnerTfsaBalance} onChange={v => set({ partnerTfsaBalance: v })} />
              </Field>
            </Row>
            <Row>
              <Field label="TFSA Contribution Room" fieldKey="partnerTfsaContribRoom" {...noteProps}
                notePlaceholder="e.g. Verified via CRA My Account in March 2026"
                hint="Check CRA My Account for exact room">
                <MoneyInput value={f.partnerTfsaContribRoom} onChange={v => set({ partnerTfsaContribRoom: v })} />
              </Field>
              <Field label="FHSA Balance" fieldKey="partnerFhsaBalance" {...noteProps}
                notePlaceholder="e.g. Opened 2023, targeting home purchase within 5 years"
                hint="First Home Savings Account">
                <MoneyInput value={f.partnerFhsaBalance} onChange={v => set({ partnerFhsaBalance: v })} />
              </Field>
            </Row>
            <div style={{ height: '1px', background: C.border, margin: '4px 0 20px' }} />
            <Field label="Spousal RRSP Balance" fieldKey="spousalRrspBalance" {...noteProps}
              notePlaceholder="e.g. Last spousal contribution was in 2023"
              hint="RRSP in partner's name, funded by primary's contributions">
              <MoneyInput value={f.spousalRrspBalance} onChange={v => set({ spousalRrspBalance: v })} />
            </Field>
          </>
        ) : (
          <>
            <Row>
              <Field label="RRSP Balance" fieldKey="rrspBalance" {...noteProps}
                notePlaceholder="e.g. Includes in-kind transfer from previous employer">
                <MoneyInput value={f.rrspBalance} onChange={v => set({ rrspBalance: v })} />
              </Field>
              <Field label="Spousal RRSP Balance" fieldKey="spousalRrspBalance" {...noteProps}
                notePlaceholder="e.g. Last spousal contribution was in 2023">
                <MoneyInput value={f.spousalRrspBalance} onChange={v => set({ spousalRrspBalance: v })} />
              </Field>
            </Row>
            <Row>
              <Field label="TFSA Balance" fieldKey="tfsaBalance" {...noteProps}
                notePlaceholder="e.g. Mix of GICs and broad-market ETFs">
                <MoneyInput value={f.tfsaBalance} onChange={v => set({ tfsaBalance: v })} />
              </Field>
              <Field label="TFSA Remaining Contribution Room" fieldKey="tfsaContribRoom" {...noteProps}
                notePlaceholder="e.g. Verified via CRA My Account in March 2026"
                hint="Check CRA My Account for your exact room">
                <MoneyInput value={f.tfsaContribRoom} onChange={v => set({ tfsaContribRoom: v })} />
              </Field>
            </Row>
            <Row>
              <Field label="FHSA Balance" fieldKey="fhsaBalance" {...noteProps}
                notePlaceholder="e.g. Opened 2023, targeting home purchase within 5 years"
                hint="First Home Savings Account - if applicable">
                <MoneyInput value={f.fhsaBalance} onChange={v => set({ fhsaBalance: v })} />
              </Field>
            </Row>
          </>
        )}
      </Card>

      <Card title="Non-Registered Investments">
        <Row>
          <Field label="High-Interest Savings (HISA)" fieldKey="hisaBalance" {...noteProps}
            notePlaceholder="e.g. Emergency fund - 6 months of living expenses">
            <MoneyInput value={f.hisaBalance} onChange={v => set({ hisaBalance: v })} />
          </Field>
          <Field label="Non-Registered Brokerage" fieldKey="nonRegBalance" {...noteProps}
            notePlaceholder="e.g. Holding individual stocks, planning to rebalance">
            <MoneyInput value={f.nonRegBalance} onChange={v => set({ nonRegBalance: v })} />
          </Field>
        </Row>
      </Card>

      <Card title="Real Estate">
        <Row>
          <Field label="Primary Residence Estimated Value" fieldKey="primaryResidenceValue" {...noteProps}
            notePlaceholder="e.g. Based on recent comparable sales in the area">
            <MoneyInput value={f.primaryResidenceValue} onChange={v => set({ primaryResidenceValue: v })} />
          </Field>
          <Field label="Secondary / Cottage Property Value" fieldKey="secondaryPropertyValue" {...noteProps}
            notePlaceholder="e.g. Cottage jointly owned - considering selling in 5 years">
            <MoneyInput value={f.secondaryPropertyValue} onChange={v => set({ secondaryPropertyValue: v })} />
          </Field>
        </Row>
      </Card>

      {hasPartner ? (
        <div className="wizard-breakdown-grid">
          <Card title={`${pName}'s Pension`}>
            <PensionFields
              pensionType={f.pensionType}
              onPensionType={v => set({ pensionType: v })}
              bridge={f.dbAnnualBridge} onBridge={v => set({ dbAnnualBridge: v })}
              lifetime={f.dbLifetimePension} onLifetime={v => set({ dbLifetimePension: v })}
              dc={f.dcBalance} onDc={v => set({ dcBalance: v })}
              noteProps={noteProps}
              notePrefix=""
            />
          </Card>
          <Card title={`${qName}'s Pension`}>
            <PensionFields
              pensionType={f.partnerPensionType}
              onPensionType={v => set({ partnerPensionType: v })}
              bridge={f.partnerDbAnnualBridge} onBridge={v => set({ partnerDbAnnualBridge: v })}
              lifetime={f.partnerDbLifetimePension} onLifetime={v => set({ partnerDbLifetimePension: v })}
              dc={f.partnerDcBalance} onDc={v => set({ partnerDcBalance: v })}
              noteProps={noteProps}
              notePrefix="partner"
            />
          </Card>
        </div>
      ) : (
        <Card title="Pension">
          <PensionFields
            pensionType={f.pensionType}
            onPensionType={v => set({ pensionType: v })}
            bridge={f.dbAnnualBridge} onBridge={v => set({ dbAnnualBridge: v })}
            lifetime={f.dbLifetimePension} onLifetime={v => set({ dbLifetimePension: v })}
            dc={f.dcBalance} onDc={v => set({ dcBalance: v })}
            noteProps={noteProps}
            notePrefix=""
          />
        </Card>
      )}
    </div>
  );
}

function Step3Liabilities({ f, set, noteProps }: { f: FormState; set: (u: Partial<FormState>) => void; noteProps: NoteProps }) {
  return (
    <div className="wizard-step-enter">
      <Card title="Housing">
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['rent', 'own'] as const).map(opt => (
              <button key={opt} type="button"
                onClick={() => set({ housingStatus: opt })}
                style={{
                  padding: '8px 22px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                  fontWeight: 600, letterSpacing: '0.04em', textTransform: 'capitalize',
                  background: f.housingStatus === opt ? C.amber : 'transparent',
                  color: f.housingStatus === opt ? '#fff' : C.muted,
                  border: `1px solid ${f.housingStatus === opt ? C.amber : C.dim}`,
                  transition: 'all 0.2s',
                }}>
                {opt === 'rent' ? 'Renting' : 'Own Home'}
              </button>
            ))}
          </div>
        </div>

        {f.housingStatus === 'own' && (
          <>
            <Row>
              <Field label="Mortgage Balance" fieldKey="mortgageBalance" {...noteProps}
                notePlaceholder="e.g. Planning a lump-sum payment at renewal">
                <MoneyInput value={f.mortgageBalance} onChange={v => set({ mortgageBalance: v })} />
              </Field>
              <Field label="Interest Rate" fieldKey="mortgageRate" {...noteProps}
                notePlaceholder="e.g. Variable rate - reviewing at renewal in Jan 2027">
                <div style={{ position: 'relative' }}>
                  <TextInput type="number" value={f.mortgageRate} onChange={v => set({ mortgageRate: v })} placeholder="5.25" />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }}>%</span>
                </div>
              </Field>
            </Row>
            <Row>
              <Field label="Term Expiry Date" fieldKey="mortgageTermExpiry" {...noteProps}
                notePlaceholder="e.g. Exploring refinancing or lump-sum options at renewal">
                <TextInput type="date" value={f.mortgageTermExpiry} onChange={v => set({ mortgageTermExpiry: v })} />
              </Field>
              <Field label="Monthly Payment" fieldKey="mortgageMonthly" {...noteProps}
                notePlaceholder="e.g. Includes property tax component">
                <MoneyInput value={f.mortgageMonthly} onChange={v => set({ mortgageMonthly: v })} />
              </Field>
            </Row>
            <Field label="HELOC Balance (if any)" fieldKey="helocBalance" {...noteProps}
              notePlaceholder="e.g. Used for home renovation, interest-only payments"
              hint="Home Equity Line of Credit">
              <MoneyInput value={f.helocBalance} onChange={v => set({ helocBalance: v })} />
            </Field>
          </>
        )}
      </Card>

      <Card title="Non-Mortgage Debt">
        <Row>
          <Field label="OSAP / Student Loan Balance" fieldKey="osapBalance" {...noteProps}
            notePlaceholder="e.g. On repayment plan, approximately $300/month"
            hint="OSAP or other student loans">
            <MoneyInput value={f.osapBalance} onChange={v => set({ osapBalance: v })} />
          </Field>
          <Field label="Vehicle Financing / Lease" fieldKey="vehicleBalance" {...noteProps}
            notePlaceholder="e.g. Lease ends Dec 2026, evaluating buyout vs. new lease">
            <MoneyInput value={f.vehicleBalance} onChange={v => set({ vehicleBalance: v })} />
          </Field>
        </Row>
        <Row>
          <Field label="Credit Card Balance" fieldKey="creditCardBalance" {...noteProps}
            notePlaceholder="e.g. Balance carries month-to-month on one card">
            <MoneyInput value={f.creditCardBalance} onChange={v => set({ creditCardBalance: v })} />
          </Field>
          <Field label="Credit Card APR" fieldKey="creditCardAPR" {...noteProps}
            notePlaceholder="e.g. Considering a balance transfer to a lower-rate card"
            hint="Typical range: 19.99% - 29.99%">
            <div style={{ position: 'relative' }}>
              <TextInput type="number" value={f.creditCardAPR} onChange={v => set({ creditCardAPR: v })} placeholder="19.99" />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }}>%</span>
            </div>
          </Field>
        </Row>
      </Card>
    </div>
  );
}

function Step4Protection({ f, set, noteProps }: { f: FormState; set: (u: Partial<FormState>) => void; noteProps: NoteProps }) {
  const hasPartner = !!f.partnerName;
  const pName = f.primaryName || 'Primary Applicant';
  const qName = f.partnerName || 'Spouse / Partner';

  const addPolicy = () => {
    const newPolicy: LifePolicy = {
      id: Math.random().toString(36).slice(2),
      type: 'term',
      insured: 'primary',
      deathBenefit: '',
      beneficiary: '',
    };
    set({ lifePolicies: [...f.lifePolicies, newPolicy] });
  };

  const updatePolicy = (id: string, update: Partial<LifePolicy>) => {
    set({ lifePolicies: f.lifePolicies.map(p => p.id === id ? { ...p, ...update } : p) });
  };

  const removePolicy = (id: string) => {
    set({ lifePolicies: f.lifePolicies.filter(p => p.id !== id) });
  };

  return (
    <div className="wizard-step-enter">
      <Card title="Life Insurance">
        {f.lifePolicies.length === 0 && (
          <p style={{ fontSize: '13px', color: C.muted, marginBottom: '16px', lineHeight: 1.5 }}>
            No policies added yet. Add each life insurance policy held by you{hasPartner ? ` or ${qName}` : ''}.
          </p>
        )}
        {f.lifePolicies.map((policy, i) => (
          <div key={policy.id} style={{
            border: `1px solid ${C.border}`, borderRadius: '12px',
            padding: '16px', marginBottom: '14px', background: C.dimBg,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: C.text, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Policy {i + 1}
              </span>
              <button type="button" onClick={() => removePolicy(policy.id)}
                style={{ background: 'none', border: `1px solid ${C.dim}`, color: C.muted, borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}>
                Remove
              </button>
            </div>
            <Row>
              <Field label="Policy Type" fieldKey={`lifeType_${policy.id}`} {...noteProps}
                notePlaceholder="e.g. Group plan - coverage may end if employment changes">
                <Select
                  value={policy.type}
                  onChange={v => updatePolicy(policy.id, { type: v as LifePolicy['type'] })}
                  options={[
                    { value: 'term', label: 'Term Life' },
                    { value: 'whole', label: 'Whole Life' },
                    { value: 'universal', label: 'Universal Life' },
                    { value: 'group', label: 'Group / Employer Plan' },
                  ]}
                />
              </Field>
              {hasPartner && (
                <Field label="Insured Person" fieldKey={`lifeInsured_${policy.id}`} {...noteProps}
                  notePlaceholder="Who is covered by this policy?">
                  <Select
                    value={policy.insured}
                    onChange={v => updatePolicy(policy.id, { insured: v as LifePolicy['insured'] })}
                    options={[
                      { value: 'primary', label: pName },
                      { value: 'partner', label: qName },
                      { value: 'joint', label: 'Joint / Both' },
                    ]}
                  />
                </Field>
              )}
            </Row>
            <Row>
              <Field label="Death Benefit" fieldKey={`lifeBenefit_${policy.id}`} {...noteProps}
                notePlaceholder="e.g. Considering increasing coverage after recent mortgage">
                <MoneyInput value={policy.deathBenefit} onChange={v => updatePolicy(policy.id, { deathBenefit: v })} />
              </Field>
              <Field label="Primary Beneficiary" fieldKey={`lifeBeneficiary_${policy.id}`} {...noteProps}
                notePlaceholder="e.g. Designation last reviewed in 2019 - may need update">
                <TextInput value={policy.beneficiary} onChange={v => updatePolicy(policy.id, { beneficiary: v })} placeholder="Spouse, Estate, etc." />
              </Field>
            </Row>
          </div>
        ))}
        <button type="button" onClick={addPolicy}
          style={{
            fontSize: '13px', color: C.amber, background: 'none',
            border: `1.5px dashed ${C.amberMid}`, borderRadius: '8px',
            padding: '10px 16px', cursor: 'pointer', width: '100%',
          }}>
          + Add Life Insurance Policy
        </button>
      </Card>

      <Card title="Extended Health & Benefits">
        {hasPartner ? (
          <div className="wizard-breakdown-grid" style={{ marginBottom: 0 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '3px', height: '14px', borderRadius: '2px', background: C.amber }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{pName}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Toggle checked={f.hasEmployerHealth} onChange={v => set({ hasEmployerHealth: v })} label="Employer health & dental" />
                <Toggle checked={f.hasLTD} onChange={v => set({ hasLTD: v })} label="Long-Term Disability (LTD)" />
                <Toggle checked={f.hasCriticalIllness} onChange={v => set({ hasCriticalIllness: v })} label="Critical Illness (CI)" />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '3px', height: '14px', borderRadius: '2px', background: C.amber }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{qName}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Toggle checked={f.partnerHasEmployerHealth} onChange={v => set({ partnerHasEmployerHealth: v })} label="Employer health & dental" />
                <Toggle checked={f.partnerHasLTD} onChange={v => set({ partnerHasLTD: v })} label="Long-Term Disability (LTD)" />
                <Toggle checked={f.partnerHasCriticalIllness} onChange={v => set({ partnerHasCriticalIllness: v })} label="Critical Illness (CI)" />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Toggle
              checked={f.hasEmployerHealth}
              onChange={v => set({ hasEmployerHealth: v })}
              label="Employer-provided extended health & dental coverage"
            />
            <Toggle
              checked={f.hasLTD}
              onChange={v => set({ hasLTD: v })}
              label="Long-Term Disability (LTD) coverage"
            />
            <Toggle
              checked={f.hasCriticalIllness}
              onChange={v => set({ hasCriticalIllness: v })}
              label="Critical Illness (CI) coverage"
            />
          </div>
        )}
      </Card>
    </div>
  );
}

function Step5Income({ f, set, noteProps }: { f: FormState; set: (u: Partial<FormState>) => void; noteProps: NoteProps }) {
  const hasPartner = !!f.partnerName;
  const pName = f.primaryName || 'Primary Applicant';
  const qName = f.partnerName || 'Spouse / Partner';

  const incomeOptions = [
    { value: 'T4', label: 'T4 Employment Income' },
    { value: 'self-employed', label: 'Self-Employed (T2125)' },
    { value: 'rental', label: 'Rental Income' },
    { value: 'mixed', label: 'Mixed Sources' },
  ];

  return (
    <div className="wizard-step-enter">
      <Card title="Household Income">
        {hasPartner ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '14px' }}>
              <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: C.amber, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: C.text, letterSpacing: '0.02em' }}>{pName}</span>
            </div>
            <Row>
              <Field label="Annual Gross Income" fieldKey="annualGrossIncome" {...noteProps}
                notePlaceholder="e.g. Expecting a raise in Q2 2026">
                <MoneyInput value={f.annualGrossIncome} onChange={v => set({ annualGrossIncome: v })} />
              </Field>
              <Field label="Income Type" fieldKey="incomeType" {...noteProps}
                notePlaceholder="e.g. T4 employment plus rental income from secondary suite">
                <Select value={f.incomeType} onChange={v => set({ incomeType: v as FormState['incomeType'] })} options={incomeOptions} />
              </Field>
            </Row>
            <div style={{ height: '1px', background: C.border, margin: '4px 0 20px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '14px' }}>
              <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: C.amber, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: C.text, letterSpacing: '0.02em' }}>{qName}</span>
            </div>
            <Row>
              <Field label="Annual Gross Income" fieldKey="partnerAnnualGrossIncome" {...noteProps}
                notePlaceholder="e.g. On parental leave in 2026">
                <MoneyInput value={f.partnerAnnualGrossIncome} onChange={v => set({ partnerAnnualGrossIncome: v })} />
              </Field>
              <Field label="Income Type" fieldKey="partnerIncomeType" {...noteProps}
                notePlaceholder="e.g. Self-employed consultant">
                <Select value={f.partnerIncomeType} onChange={v => set({ partnerIncomeType: v as FormState['partnerIncomeType'] })} options={incomeOptions} />
              </Field>
            </Row>
          </>
        ) : (
          <>
            <Field label="Annual Gross Household Income" fieldKey="annualGrossIncome" {...noteProps}
              notePlaceholder="e.g. Expecting a raise in Q2 2026; includes rental income"
              hint="Combined gross income before taxes. For self-employed, use net business income.">
              <MoneyInput value={f.annualGrossIncome} onChange={v => set({ annualGrossIncome: v })} />
            </Field>
            <Field label="Primary Income Type" fieldKey="incomeType" {...noteProps}
              notePlaceholder="e.g. Mix of T4 employment and rental income from a secondary suite">
              <Select
                value={f.incomeType}
                onChange={v => set({ incomeType: v as FormState['incomeType'] })}
                options={incomeOptions}
              />
            </Field>
          </>
        )}
        <div style={{ marginTop: '16px', padding: '12px 14px', background: C.amberLight, border: `1px solid ${C.amberMid}`, borderRadius: '10px' }}>
          <p style={{ fontSize: '12px', color: C.body, margin: 0 }}>
            <span style={{ color: C.amberDark, fontWeight: 600 }}>Ontario only.</span> Province is fixed for tax context. Your financial professional will use this to understand your marginal rate bracket.
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── Metric Stat ──────────────────────────────────────────────────────────────

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 12px' }}>
      <p style={{ fontSize: '11px', color: C.muted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '26px', fontWeight: 400, color: accent ?? C.text, margin: 0 }}>{value}</p>
    </div>
  );
}

function Insight({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      borderLeft: `3px solid ${C.amber}`, paddingLeft: '14px', margin: '8px 0',
      fontSize: '13px', color: C.body, lineHeight: 1.55,
    }}>
      {children}
    </div>
  );
}

function InsightSection({ m, f }: { m: ReturnType<typeof computeMetrics>; f: FormState }) {
  const insights: React.ReactNode[] = [];

  if (m.creditCard > 0) {
    const apr = parseFloat(f.creditCardAPR) || 19.99;
    insights.push(
      <Insight key="cc">
        You carry <strong style={{ color: C.amber }}>{fmt(m.creditCard)}</strong> in credit card debt at {apr}% APR - one of the highest-cost debts. Consider exploring the <strong>Debt Avalanche</strong> strategy to reduce interest cost first.
      </Insight>
    );
  }

  if (f.planningResp && m.respMonthly * 12 < m.cegsBenchmark && m.respMonthly > 0) {
    const annualShortfall = m.cegsBenchmark - m.respMonthly * 12;
    insights.push(
      <Insight key="resp">
        Your RESP contribution of <strong style={{ color: C.amber }}>{fmt(m.respMonthly)}/mo</strong> ({fmt(m.respMonthly * 12)}/yr) is <strong style={{ color: C.red }}>{fmt(annualShortfall)}/yr</strong> short of the $2,500/yr threshold to fully capture the Canada Education Savings Grant (CESG) of $500/year. Consider contributing at least <strong>$209/month</strong>.
      </Insight>
    );
  }
  if (f.planningResp && m.respMonthly === 0) {
    insights.push(
      <Insight key="resp0">
        You're planning for post-secondary but RESP contributions are not recorded. To maximize the 20% CESG match, contribute at least <strong style={{ color: C.amber }}>$208/month</strong>.
      </Insight>
    );
  }

  if (m.tfsaRoom > 5000) {
    insights.push(
      <Insight key="tfsa">
        You have <strong style={{ color: C.amber }}>{fmt(m.tfsaRoom)}</strong> in unused TFSA contribution room. Tax-free growth is one of the most powerful tools available to Canadians - consider maximizing this account.
      </Insight>
    );
  }

  if (m.annualIncome > 0) {
    if (m.lifeInsurance === 0) {
      insights.push(
        <Insight key="life0">
          No life insurance is recorded. The common 10× income benchmark suggests a death benefit of approximately <strong style={{ color: C.amber }}>{fmt(m.recommendedInsurance)}</strong>. Consult a licensed advisor to assess your specific need.
        </Insight>
      );
    } else if (m.insuranceGap > 0) {
      insights.push(
        <Insight key="life-gap">
          Your current life insurance coverage of <strong style={{ color: C.amber }}>{fmt(m.lifeInsurance)}</strong> is <strong style={{ color: C.red }}>{fmt(m.insuranceGap)}</strong> below the 10× income benchmark of {fmt(m.recommendedInsurance)}. Review with your advisor.
        </Insight>
      );
    }
  }

  const primaryUnprotected = !f.hasLTD && !f.hasEmployerHealth;
  const partnerUnprotected = !!f.partnerName && !f.partnerHasLTD && !f.partnerHasEmployerHealth;
  if (primaryUnprotected || partnerUnprotected) {
    const subject = (primaryUnprotected && partnerUnprotected)
      ? 'Neither applicant has'
      : primaryUnprotected
      ? `${f.primaryName || 'The primary applicant'} has no`
      : `${f.partnerName} has no`;
    insights.push(
      <Insight key="ltd">
        {subject} Long-Term Disability or employer health coverage recorded. Disability is statistically more likely before age 65 than death; individual LTD coverage is worth exploring.
      </Insight>
    );
  }

  if (insights.length === 0) {
    insights.push(
      <Insight key="good">
        Your financial data looks well-organized. Bring this snapshot to your advisor for a comprehensive review.
      </Insight>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {insights}
    </div>
  );
}

// ─── Print Document ───────────────────────────────────────────────────────────

function PrintDocument({ f, m }: { f: FormState; m: ReturnType<typeof computeMetrics> }) {
  const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  const noteFor = (key: string) => f.notes[key] ? `Note: ${f.notes[key]}` : '';

  return (
    <div className="print-only snapshot-doc">
      {/* Header */}
      <div style={{ borderBottom: '2pt solid #d97706', paddingBottom: '12pt', marginBottom: '16pt' }}>
        <h1 style={{ margin: 0, fontFamily: 'Georgia, serif' }}>Financial Discovery Snapshot</h1>
        <p style={{ margin: '4pt 0 0', fontSize: '10pt', color: '#555' }}>
          {f.primaryName || 'Client'}{f.partnerName ? ` & ${f.partnerName}` : ''} &nbsp;·&nbsp; Ontario, Canada &nbsp;·&nbsp; {today}
        </p>
        {(f.phone || f.email || f.address) && (
          <p style={{ margin: '3pt 0 0', fontSize: '9.5pt', color: '#555' }}>
            {f.phone && <span>{f.phone}</span>}
            {f.phone && f.email && <span> &nbsp;·&nbsp; </span>}
            {f.email && <span>{f.email}</span>}
            {(f.phone || f.email) && f.address && <span> &nbsp;·&nbsp; </span>}
            {f.address && <span>{f.address}{f.city ? `, ${f.city}` : ''}{f.postalCode ? ` ${f.postalCode}` : ''}</span>}
          </p>
        )}
        <p style={{ margin: '4pt 0 0', fontSize: '9pt', color: '#888', fontStyle: 'italic' }}>
          This document is for informational purposes for Ontario residents only and does not constitute professional financial, legal, or tax advice. No fiduciary relationship is created.
        </p>
      </div>

      {/* Executive Summary */}
      <h2>Executive Summary</h2>
      <table>
        <tbody>
          <tr><td><strong>Total Assets</strong></td><td>{fmt(m.totalAssets)}</td></tr>
          <tr><td><strong>Total Liabilities</strong></td><td>{fmt(m.totalLiabilities)}</td></tr>
          <tr><td><strong>Estimated Net Worth</strong></td><td><strong>{fmt(m.netWorth)}</strong></td></tr>
          <tr><td>Total Monthly Debt Obligations (est.)</td><td>{fmt(m.monthlyDebt)}</td></tr>
          <tr><td>Total Life Insurance Coverage</td><td>{m.lifeInsurance > 0 ? fmt(m.lifeInsurance) : 'None recorded'}</td></tr>
          <tr><td>Annual Gross Household Income</td><td>{m.annualIncome > 0 ? fmt(m.annualIncome) : 'Not provided'}</td></tr>
        </tbody>
      </table>

      {/* Household */}
      <h2>Household Profile</h2>
      <table>
        <tbody>
          <tr><td>Primary Applicant</td><td>{f.primaryName || '-'}</td><td>{f.primaryDOB ? `DOB: ${f.primaryDOB}` : ''}</td></tr>
          {f.partnerName && <tr><td>Partner</td><td>{f.partnerName}</td><td>{f.partnerDOB ? `DOB: ${f.partnerDOB}` : ''}</td></tr>}
          {f.dependents.map((d, i) => (
            <tr key={i}><td>Dependent {i + 1}</td><td>{d.name || '-'}</td><td>{d.dob ? `DOB: ${d.dob}` : ''}</td></tr>
          ))}
          {f.planningResp && <tr><td>RESP Balance</td><td>{fmt(parseDollar(f.respBalance))}</td><td>{fmt(parseDollar(f.respMonthlyContrib))}/mo</td></tr>}
        </tbody>
      </table>
      {(f.phone || f.email || f.address) && (
        <>
          <h3>Contact</h3>
          <table>
            <tbody>
              {f.phone && <tr><td>Phone</td><td>{f.phone}</td></tr>}
              {f.email && <tr><td>Email</td><td>{f.email}</td></tr>}
              {f.address && <tr><td>Address</td><td>{f.address}{f.city ? `, ${f.city}` : ''}{f.postalCode ? ` ${f.postalCode}` : ''}, Ontario</td></tr>}
            </tbody>
          </table>
        </>
      )}

      {/* Assets */}
      <h2>Assets</h2>
      <h3>Registered Accounts</h3>
      <table>
        <thead><tr><th>Account</th><th>Balance</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td>RRSP {f.partnerName ? `(${f.primaryName || 'Primary'})` : ''}</td><td>{fmt(parseDollar(f.rrspBalance))}</td><td className="snapshot-note">{noteFor('rrspBalance')}</td></tr>
          {f.partnerName && parseDollar(f.partnerRrspBalance) > 0 && <tr><td>RRSP ({f.partnerName})</td><td>{fmt(parseDollar(f.partnerRrspBalance))}</td><td className="snapshot-note">{noteFor('partnerRrspBalance')}</td></tr>}
          {parseDollar(f.spousalRrspBalance) > 0 && <tr><td>Spousal RRSP</td><td>{fmt(parseDollar(f.spousalRrspBalance))}</td><td className="snapshot-note">{noteFor('spousalRrspBalance')}</td></tr>}
          <tr><td>TFSA {f.partnerName ? `(${f.primaryName || 'Primary'})` : ''}</td><td>{fmt(parseDollar(f.tfsaBalance))}</td><td className="snapshot-note">{noteFor('tfsaBalance')}{f.tfsaContribRoom ? ` Remaining room: ${fmt(parseDollar(f.tfsaContribRoom))}` : ''}</td></tr>
          {f.partnerName && parseDollar(f.partnerTfsaBalance) > 0 && <tr><td>TFSA ({f.partnerName})</td><td>{fmt(parseDollar(f.partnerTfsaBalance))}</td><td className="snapshot-note">{noteFor('partnerTfsaBalance')}{f.partnerTfsaContribRoom ? ` Remaining room: ${fmt(parseDollar(f.partnerTfsaContribRoom))}` : ''}</td></tr>}
          {parseDollar(f.fhsaBalance) > 0 && <tr><td>FHSA {f.partnerName ? `(${f.primaryName || 'Primary'})` : ''}</td><td>{fmt(parseDollar(f.fhsaBalance))}</td><td className="snapshot-note">{noteFor('fhsaBalance')}</td></tr>}
          {f.partnerName && parseDollar(f.partnerFhsaBalance) > 0 && <tr><td>FHSA ({f.partnerName})</td><td>{fmt(parseDollar(f.partnerFhsaBalance))}</td><td className="snapshot-note">{noteFor('partnerFhsaBalance')}</td></tr>}
          {f.pensionType !== 'none' && <tr><td>Pension{f.partnerName ? ` (${f.primaryName || 'Primary'}, ${f.pensionType})` : ` (${f.pensionType})`}</td><td>{f.pensionType === 'DC' ? fmt(parseDollar(f.dcBalance)) : `${fmt(parseDollar(f.dbLifetimePension))}/yr lifetime`}</td><td className="snapshot-note">{f.pensionType === 'DB' && f.dbAnnualBridge ? `Bridge: ${fmt(parseDollar(f.dbAnnualBridge))}/yr` : ''}</td></tr>}
          {f.partnerName && f.partnerPensionType !== 'none' && <tr><td>Pension ({f.partnerName}, {f.partnerPensionType})</td><td>{f.partnerPensionType === 'DC' ? fmt(parseDollar(f.partnerDcBalance)) : `${fmt(parseDollar(f.partnerDbLifetimePension))}/yr lifetime`}</td><td className="snapshot-note">{f.partnerPensionType === 'DB' && f.partnerDbAnnualBridge ? `Bridge: ${fmt(parseDollar(f.partnerDbAnnualBridge))}/yr` : ''}</td></tr>}
          <tr style={{ fontWeight: 'bold' }}><td>Subtotal - Registered</td><td>{fmt(m.totalRegistered)}</td><td></td></tr>
        </tbody>
      </table>
      <h3>Non-Registered & Real Estate</h3>
      <table>
        <thead><tr><th>Item</th><th>Value</th><th>Notes</th></tr></thead>
        <tbody>
          {parseDollar(f.hisaBalance) > 0 && <tr><td>HISA</td><td>{fmt(parseDollar(f.hisaBalance))}</td><td className="snapshot-note">{noteFor('hisaBalance')}</td></tr>}
          {parseDollar(f.nonRegBalance) > 0 && <tr><td>Non-Reg Brokerage</td><td>{fmt(parseDollar(f.nonRegBalance))}</td><td className="snapshot-note">{noteFor('nonRegBalance')}</td></tr>}
          {parseDollar(f.primaryResidenceValue) > 0 && <tr><td>Primary Residence</td><td>{fmt(parseDollar(f.primaryResidenceValue))}</td><td className="snapshot-note">{noteFor('primaryResidenceValue')}</td></tr>}
          {parseDollar(f.secondaryPropertyValue) > 0 && <tr><td>Secondary / Cottage</td><td>{fmt(parseDollar(f.secondaryPropertyValue))}</td><td className="snapshot-note">{noteFor('secondaryPropertyValue')}</td></tr>}
          <tr style={{ fontWeight: 'bold' }}><td>Subtotal - Non-Reg + RE</td><td>{fmt(m.totalNonReg + m.totalRealEstate)}</td><td></td></tr>
        </tbody>
      </table>

      {/* Liabilities */}
      <h2>Liabilities</h2>
      <table>
        <thead><tr><th>Item</th><th>Balance</th><th>Notes</th></tr></thead>
        <tbody>
          {f.housingStatus === 'own' && parseDollar(f.mortgageBalance) > 0 && (
            <tr><td>Mortgage ({f.mortgageRate ? `${f.mortgageRate}%` : ''})</td><td>{fmt(m.mortgage)}</td>
              <td className="snapshot-note">{f.mortgageTermExpiry ? `Term expires: ${f.mortgageTermExpiry}` : ''}{noteFor('mortgageBalance')}</td></tr>
          )}
          {m.heloc > 0 && <tr><td>HELOC</td><td>{fmt(m.heloc)}</td><td className="snapshot-note">{noteFor('helocBalance')}</td></tr>}
          {m.osap > 0 && <tr><td>OSAP / Student Loan</td><td>{fmt(m.osap)}</td><td className="snapshot-note">{noteFor('osapBalance')}</td></tr>}
          {m.creditCard > 0 && <tr><td>Credit Card{f.creditCardAPR ? ` (${f.creditCardAPR}% APR)` : ''}</td><td>{fmt(m.creditCard)}</td><td className="snapshot-note">{noteFor('creditCardBalance')}</td></tr>}
          {m.vehicle > 0 && <tr><td>Vehicle Financing</td><td>{fmt(m.vehicle)}</td><td className="snapshot-note">{noteFor('vehicleBalance')}</td></tr>}
          <tr style={{ fontWeight: 'bold' }}><td>Total Liabilities</td><td>{fmt(m.totalLiabilities)}</td><td></td></tr>
        </tbody>
      </table>

      {/* Protection */}
      <h2>Risk & Protection</h2>
      <table>
        <tbody>
          {f.lifePolicies.length === 0 ? (
            <tr><td>Life Insurance</td><td>None recorded</td><td></td></tr>
          ) : (
            f.lifePolicies.map((p, i) => (
              <tr key={p.id}>
                <td>Policy {i + 1} ({p.type.charAt(0).toUpperCase() + p.type.slice(1)}{f.partnerName ? ` - ${p.insured === 'primary' ? f.primaryName || 'Primary' : p.insured === 'partner' ? f.partnerName : 'Joint'}` : ''})</td>
                <td>{fmt(parseDollar(p.deathBenefit))}</td>
                <td>{p.beneficiary ? `Beneficiary: ${p.beneficiary}` : ''}</td>
              </tr>
            ))
          )}
          {f.partnerName ? (
            <>
              <tr><td>Extended Health & Dental</td><td>{f.primaryName || 'Primary'}: {f.hasEmployerHealth ? 'Covered' : 'Not covered'} · {f.partnerName}: {f.partnerHasEmployerHealth ? 'Covered' : 'Not covered'}</td><td></td></tr>
              <tr><td>Long-Term Disability</td><td>{f.primaryName || 'Primary'}: {f.hasLTD ? 'Covered' : 'Not covered'} · {f.partnerName}: {f.partnerHasLTD ? 'Covered' : 'Not covered'}</td><td></td></tr>
              <tr><td>Critical Illness</td><td>{f.primaryName || 'Primary'}: {f.hasCriticalIllness ? 'Covered' : 'Not covered'} · {f.partnerName}: {f.partnerHasCriticalIllness ? 'Covered' : 'Not covered'}</td><td></td></tr>
            </>
          ) : (
            <>
              <tr><td>Extended Health & Dental</td><td>{f.hasEmployerHealth ? 'Employer-provided' : 'Not covered'}</td><td></td></tr>
              <tr><td>Long-Term Disability</td><td>{f.hasLTD ? 'Covered' : 'Not covered'}</td><td></td></tr>
              <tr><td>Critical Illness</td><td>{f.hasCriticalIllness ? 'Covered' : 'Not covered'}</td><td></td></tr>
            </>
          )}
        </tbody>
      </table>

      {/* Income */}
      <h2>Income & Cash Flow</h2>
      <table>
        <tbody>
          {f.partnerName ? (
            <>
              <tr><td>Annual Gross Income ({f.primaryName || 'Primary'})</td><td>{parseDollar(f.annualGrossIncome) > 0 ? fmt(parseDollar(f.annualGrossIncome)) : 'Not provided'}</td></tr>
              <tr><td>Income Type</td><td>{f.incomeType}</td></tr>
              <tr><td>Annual Gross Income ({f.partnerName})</td><td>{parseDollar(f.partnerAnnualGrossIncome) > 0 ? fmt(parseDollar(f.partnerAnnualGrossIncome)) : 'Not provided'}</td></tr>
              <tr><td>Income Type</td><td>{f.partnerIncomeType}</td></tr>
              <tr><td>Combined Household Income</td><td>{m.annualIncome > 0 ? fmt(m.annualIncome) : 'Not provided'}</td></tr>
            </>
          ) : (
            <>
              <tr><td>Annual Gross Household Income</td><td>{m.annualIncome > 0 ? fmt(m.annualIncome) : 'Not provided'}</td></tr>
              <tr><td>Income Type</td><td>{f.incomeType}</td></tr>
            </>
          )}
          <tr><td>Province</td><td>Ontario, Canada</td></tr>
        </tbody>
      </table>

      {/* Discovery Prompts */}
      <h2>Discovery Prompts for Your Advisor</h2>
      {m.creditCard > 0 && (
        <div className="snapshot-insight">
          You have {fmt(m.creditCard)} in high-interest debt; consider our Debt Snowball / Avalanche tool to build a repayment plan.
        </div>
      )}
      {f.planningResp && m.respMonthly * 12 < m.cegsBenchmark && (
        <div className="snapshot-insight">
          Ensure you are maximizing the 20% CESG match in your RESP by contributing at least $208/month.
        </div>
      )}
      {m.annualIncome > 0 && m.insuranceGap > 0 && (
        <div className="snapshot-insight">
          Review your Life Insurance; current coverage is {fmt(m.lifeInsurance)} against a recommended 10× income baseline of {fmt(m.recommendedInsurance)}.
        </div>
      )}
      {m.tfsaRoom > 5000 && (
        <div className="snapshot-insight">
          You have {fmt(m.tfsaRoom)} in unused TFSA room. Maximizing tax-free growth should be a priority.
        </div>
      )}
    </div>
  );
}

// ─── Step 6 - Review ──────────────────────────────────────────────────────────

function Step6Review({ f }: { f: FormState }) {
  const m = computeMetrics(f);

  return (
    <div className="wizard-step-enter">
      {/* Key metrics bar */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: '14px', marginBottom: '20px', overflow: 'hidden',
      }}>
        <div className="wizard-metrics-top" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div style={{ padding: '20px 12px', borderRight: `1px solid ${C.border}` }}>
            <p style={{ fontSize: '11px', color: C.muted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px' }}>Total Assets</p>
            <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '28px', fontWeight: 400, color: C.green, margin: 0 }}>{fmt(m.totalAssets)}</p>
          </div>
          <div style={{ padding: '20px 12px', borderRight: `1px solid ${C.border}` }}>
            <p style={{ fontSize: '11px', color: C.muted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px' }}>Total Liabilities</p>
            <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '28px', fontWeight: 400, color: C.red, margin: 0 }}>{fmt(m.totalLiabilities)}</p>
          </div>
          <div style={{ padding: '20px 12px' }}>
            <p style={{ fontSize: '11px', color: C.muted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px' }}>Net Worth</p>
            <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '28px', fontWeight: 400, color: m.netWorth >= 0 ? C.amber : C.red, margin: 0 }}>{fmt(m.netWorth)}</p>
          </div>
        </div>
        <div className="wizard-metrics-bottom">
          <Stat label="Monthly Debt (est.)" value={fmt(m.monthlyDebt)} />
          <Stat label="Life Coverage" value={m.lifeInsurance > 0 ? fmt(m.lifeInsurance) : '-'} />
          <Stat label="Annual Income" value={m.annualIncome > 0 ? fmt(m.annualIncome) : '-'} />
        </div>
      </div>

      {/* Assets breakdown */}
      <div className="wizard-breakdown-grid">
        <Card title="Assets Breakdown">
          {[
            { label: 'Registered Accounts', val: m.totalRegistered },
            { label: 'Non-Registered', val: m.totalNonReg },
            { label: 'Real Estate', val: m.totalRealEstate },
            { label: 'RESP', val: m.resp },
          ].filter(r => r.val > 0).map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: '13px' }}>
              <span style={{ color: C.muted }}>{r.label}</span>
              <span style={{ color: C.text, fontWeight: 500 }}>{fmt(r.val)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: '14px' }}>
            <span style={{ color: C.amber, fontWeight: 600 }}>Total</span>
            <span style={{ color: C.amber, fontWeight: 600 }}>{fmt(m.totalAssets)}</span>
          </div>
        </Card>

        <Card title="Liabilities Breakdown">
          {[
            { label: 'Mortgage', val: m.mortgage },
            { label: 'HELOC', val: m.heloc },
            { label: 'OSAP / Student Loans', val: m.osap },
            { label: 'Credit Card', val: m.creditCard },
            { label: 'Vehicle', val: m.vehicle },
          ].filter(r => r.val > 0).map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: '13px' }}>
              <span style={{ color: C.muted }}>{r.label}</span>
              <span style={{ color: C.text, fontWeight: 500 }}>{fmt(r.val)}</span>
            </div>
          ))}
          {m.totalLiabilities === 0 && <p style={{ color: C.muted, fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No liabilities recorded</p>}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: '14px' }}>
            <span style={{ color: C.red, fontWeight: 600 }}>Total</span>
            <span style={{ color: C.red, fontWeight: 600 }}>{fmt(m.totalLiabilities)}</span>
          </div>
        </Card>
      </div>

      {/* Discovery Insights */}
      <Card title="Discovery Insights">
        <InsightSection m={m} f={f} />
      </Card>

      {/* Export button */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <button
          type="button"
          onClick={() => window.print()}
          className="no-print"
          style={{
            background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`,
            color: '#fff', border: 'none', borderRadius: '10px',
            padding: '14px 36px', fontSize: '15px', fontWeight: 700,
            letterSpacing: '0.04em', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(217,119,6,0.2)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.target as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(217,119,6,0.3)'; }}
          onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = ''; (e.target as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(217,119,6,0.2)'; }}
        >
          ↓ Download Financial Snapshot (PDF)
        </button>
        <p style={{ fontSize: '11px', color: C.dim, marginTop: '10px' }}>
          Opens browser print dialog. Save as PDF for a portable document.
        </p>
      </div>

    </div>
  );
}

// ─── Note props helper ────────────────────────────────────────────────────────

interface NoteProps {
  notes: Record<string, string>;
  notesOpen: Record<string, boolean>;
  onNoteToggle: (key: string) => void;
  onNoteChange: (key: string, val: string) => void;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const STEP_LABELS = ['Household', 'Assets', 'Liabilities', 'Protection', 'Income', 'Snapshot'];

function ProgressBar({ step, onStepClick }: { step: number; onStepClick: (s: number) => void }) {
  return (
    <div className="no-print" style={{ marginBottom: '36px' }}>
      {/* Line track */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Background line */}
        <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', height: '1px', background: C.dim }} />
        {/* Progress line */}
        <div style={{
          position: 'absolute', top: '15px', left: '15px',
          height: '1px', background: C.amber,
          width: step <= 1 ? '0%' : `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%`,
          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />

        {STEP_LABELS.map((label, i) => {
          const s = i + 1;
          const done = s < step;
          const active = s === step;
          const clickable = true;
          return (
            <div key={s} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 }}>
              <button
                type="button"
                onClick={() => clickable && onStepClick(s)}
                title={clickable ? `Go to Step ${s}: ${label}` : undefined}
                style={{
                  width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700,
                  background: done ? C.amber : active ? '#fff' : C.dimBg,
                  border: `1.5px solid ${done ? C.amber : active ? C.amber : C.border}`,
                  color: done ? '#fff' : active ? C.amber : C.dim,
                  boxShadow: active ? `0 0 0 4px ${C.amberLight}` : 'none',
                  transition: 'all 0.3s',
                  cursor: clickable ? 'pointer' : 'default',
                  padding: 0,
                }}
              >
                {done ? '✓' : s}
              </button>
              <span style={{
                fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em',
                textTransform: 'uppercase', textAlign: 'center',
                color: active ? C.amber : done ? C.amber : C.dim,
                display: 'none',
              }}
                className="sm-show"
              >{label}</span>
            </div>
          );
        })}
      </div>
      {/* Active step label */}
      <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '11px', color: C.muted, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        Step {step} of {TOTAL_STEPS} - {STEP_LABELS[step - 1]}
      </p>
    </div>
  );
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="wizard-step-enter" style={{ textAlign: 'center', padding: '40px 20px 20px' }}>
      <div style={{
        display: 'inline-flex', padding: '14px 18px', borderRadius: '16px',
        background: C.amberLight,
        border: `1px solid ${C.amberMid}`, marginBottom: '28px',
      }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="10" fill={C.amberMid}/>
          <path d="M20 8L8 14v12l12 6 12-6V14L20 8z" stroke={C.amber} strokeWidth="1.5" fill="none"/>
          <path d="M20 8v18M8 14l12 6 12-6" stroke={C.amber} strokeWidth="1.5" fill="none"/>
        </svg>
      </div>

      <h1 style={{
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 400,
        color: C.text, lineHeight: 1.2, marginBottom: '12px',
      }}>
        Financial Discovery<br />
        <em style={{ color: C.amber }}>Snapshot Tool</em>
      </h1>

      <p style={{ color: C.muted, fontSize: '15px', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.65 }}>
        A step-by-step questionnaire designed for Ontario residents. Organize your financial picture to share with a professional - or simply to understand where you stand.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px', margin: '0 auto 36px' }}>
        {[
          { icon: '🔒', text: 'All data stays in your browser - nothing is sent to a server' },
          { icon: '🍁', text: 'Built for Ontario, Canada - Canadian-specific accounts & terms' },
          { icon: '📋', text: 'Export a professional PDF snapshot when you\'re done' },
        ].map(item => (
          <div key={item.icon} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: C.card, borderRadius: '10px', padding: '12px 16px',
            border: `1px solid ${C.border}`,
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
            <p style={{ margin: 0, fontSize: '13px', color: C.muted, textAlign: 'left' }}>{item.text}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onStart}
        style={{
          background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`,
          color: '#fff', border: 'none', borderRadius: '10px',
          padding: '14px 40px', fontSize: '15px', fontWeight: 700,
          letterSpacing: '0.05em', cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(217,119,6,0.2)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = ''; }}
      >
        Begin Discovery →
      </button>

      <p style={{ marginTop: '16px', fontSize: '11px', color: C.dim }}>
        Takes about 5-10 minutes &nbsp;·&nbsp; You can skip any field
      </p>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function FinancialDiscoveryWizard() {
  const [step, setStep] = useState(DEV_AUTOFILL ? 1 : 0);
  const [form, setForm] = useState<FormState>(DEV_AUTOFILL ? SAMPLE : INITIAL);
  const topRef = useRef<HTMLDivElement>(null);

  const update = useCallback((u: Partial<FormState>) => {
    setForm(prev => ({ ...prev, ...u }));
  }, []);

  const noteProps: NoteProps = {
    notes: form.notes,
    notesOpen: form.notesOpen,
    onNoteToggle: (key) => update({ notesOpen: { ...form.notesOpen, [key]: !(form.notesOpen[key] ?? false) } }),
    onNoteChange: (key, val) => update({ notes: { ...form.notes, [key]: val } }),
  };

  const scrollTop = () => {
    if (!topRef.current) return;
    const navHeight = (document.querySelector('nav') as HTMLElement | null)?.offsetHeight ?? 64;
    const y = topRef.current.getBoundingClientRect().top + window.scrollY - navHeight - 16;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const goNext = () => { setStep(s => s + 1); setTimeout(scrollTop, 50); };
  const goPrev = () => { setStep(s => s - 1); setTimeout(scrollTop, 50); };

  const stepProps = { f: form, set: update, noteProps };

  return (
    <div ref={topRef} style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      {/* Wizard container */}
      <div
        className="no-print"
        style={{
          background: C.bg,
          borderRadius: '20px', border: `1px solid ${C.border}`,
          padding: 'clamp(16px, 4vw, 40px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        {DEV_AUTOFILL && (
          <div style={{
            background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px',
            padding: '8px 14px', marginBottom: '16px', fontSize: '12px', color: '#713f12',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span>⚠</span>
            <span><strong>Dev mode:</strong> Form pre-filled with sample data. Set <code>DEV_AUTOFILL = false</code> to disable.</span>
          </div>
        )}
        {step === 0 ? (
          <WelcomeScreen onStart={goNext} />
        ) : (
          <>
            <ProgressBar step={step} onStepClick={s => { setStep(s); setTimeout(scrollTop, 50); }} />

            {step === 1 && <Step1Household {...stepProps} />}
            {step === 2 && <Step2Assets {...stepProps} />}
            {step === 3 && <Step3Liabilities {...stepProps} />}
            {step === 4 && <Step4Protection {...stepProps} />}
            {step === 5 && <Step5Income {...stepProps} />}
            {step === 6 && <Step6Review f={form} />}

            {/* Navigation */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', gap: '12px' }}>
              <button
                type="button"
                onClick={goPrev}
                style={{
                  background: 'none', border: `1px solid ${C.border}`,
                  color: C.muted, borderRadius: '10px',
                  padding: '12px 24px', fontSize: '14px', cursor: 'pointer',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { const b = e.target as HTMLButtonElement; b.style.borderColor = C.amber; b.style.color = C.text; }}
                onMouseLeave={e => { const b = e.target as HTMLButtonElement; b.style.borderColor = C.border; b.style.color = C.muted; }}
              >
                ← Back
              </button>

              {step < TOTAL_STEPS && (
                <button
                  type="button"
                  onClick={goNext}
                  style={{
                    background: `linear-gradient(135deg, ${C.amber}, ${C.amberDark})`,
                    color: '#fff', border: 'none', borderRadius: '10px',
                    padding: '12px 28px', fontSize: '14px', fontWeight: 700,
                    letterSpacing: '0.04em', cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    boxShadow: '0 4px 16px rgba(217,119,6,0.15)',
                  }}
                  onMouseEnter={e => { (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = ''; }}
                >
                  {step === TOTAL_STEPS - 1 ? 'Review Snapshot →' : 'Continue →'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
      {/* PrintDocument lives outside no-print so it's visible when printing */}
      {step === 6 && <PrintDocument f={form} m={computeMetrics(form)} />}
    </div>
  );
}
