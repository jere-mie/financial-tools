import { html, useState, useEffect } from '../vendor/standalone-preact.esm.js';
import { IntroStep } from './ThoroughCalcSteps/IntroStep.js';
import { PersonalStep } from './ThoroughCalcSteps/PersonalStep.js';
import { LiabilitiesStep } from './ThoroughCalcSteps/LiabilitiesStep.js';
import { AssetsStep } from './ThoroughCalcSteps/AssetsStep.js';
import { ReportStep } from './ThoroughCalcSteps/ReportStep.js';

export function ThoroughCalculator() {
    const [step, setStep] = useState(0);
    const [mode, setMode] = useState('single'); // 'single' or 'joint'

    // State Data
    const [spouse1, setSpouse1] = useState({ name: 'John Doe', income: 60000, years: 10, dob: '', email: '', phone: '', smoker: false });
    const [spouse2, setSpouse2] = useState({ name: 'Jane Doe', income: 50000, years: 10, dob: '', email: '', phone: '', smoker: false });

    const [liabilities, setLiabilities] = useState({
        mortgage: 300000,
        debts: 20000, // Credit cards, loans
        finalExpenses: 15000 // Funeral, etc.
    });

    // Children State
    // format for children: { name: '', dob: '', cost: 60000 }
    const [children, setChildren] = useState([]);

    const [assets, setAssets] = useState({
        cash: 20000,
        investments: 30000,
        policies: []
    });

    const [results, setResults] = useState(null);

    const calculate = () => {
        const totalEducationCost = children.reduce((sum, child) => sum + (Number(child.cost) || 0), 0);
        const totalLiabilities = liabilities.mortgage + liabilities.debts + liabilities.finalExpenses + totalEducationCost;

        // Scenario 1: Spouse 1 passes away
        // Needs: Income Replacement for S1 + Liabilities
        // Assets: Cash + Investments + S1's Existing Insurance
        const needs1 = (spouse1.income * spouse1.years) + totalLiabilities;
        const totalSavings = assets.cash + assets.investments;

        const insurance1 = assets.policies
            .filter(p => p.owner === 'spouse1')
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        const assets1 = totalSavings + insurance1;
        const gap1 = Math.max(0, needs1 - assets1);

        // Scenario 2: Spouse 2 passes away (only if joint)
        let gap2 = 0;
        let needs2 = 0;
        let assets2 = 0;

        if (mode === 'joint') {
            needs2 = (spouse2.income * spouse2.years) + totalLiabilities;

            const insurance2 = assets.policies
                .filter(p => p.owner === 'spouse2')
                .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

            assets2 = totalSavings + insurance2;
            gap2 = Math.max(0, needs2 - assets2);
        }

        setResults({
            spouse1: { needs: needs1, assets: assets1, gap: gap1 },
            spouse2: { needs: needs2, assets: assets2, gap: gap2 },
            totalLiabilities,
            totalEducationCost
        });
    };

    useEffect(() => {
        calculate();
    }, [mode, spouse1, spouse2, liabilities, children, assets]);

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);
    const goToStep = (s) => setStep(s);

    const steps = [
        { title: 'Start', component: IntroStep },
        { title: 'Personal', component: PersonalStep },
        { title: 'Liabilities', component: LiabilitiesStep },
        { title: 'Assets', component: AssetsStep },
        { title: 'Report', component: ReportStep }
    ];

    const CurrentStep = steps[step].component;

    // Props to pass to current step
    const stepProps = {
        mode, setMode, nextStep,
        spouse1, setSpouse1,
        spouse2, setSpouse2,
        liabilities, setLiabilities,
        children, setChildren,
        assets, setAssets,
        results
    };

    return html`
        <div class="max-w-5xl mx-auto p-6">
            <!-- Progress Bar (Hidden on Print) -->
            <div class="mb-8 print:hidden">
                <div class="flex justify-between mb-2">
                    ${steps.map((s, i) => html`
                        <div class="flex flex-col items-center w-full ${i <= step ? 'text-indigo-600' : 'text-slate-300'}">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 transition-colors ${i <= step ? 'bg-indigo-100' : 'bg-slate-100'}">
                                ${i + 1}
                            </div>
                            <span class="text-xs hidden md:block">${s.title}</span>
                        </div>
                    `)}
                </div>
                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-indigo-600 transition-all duration-500 ease-out" style="width: ${(step / (steps.length - 1)) * 100}%"></div>
                </div>
            </div>

            <!-- Content -->
            <div class="mb-8 print:mb-0 min-h-[400px] print:min-h-0">
                <${CurrentStep} ...${stepProps} />
            </div>

            <!-- Navigation (Hidden on Print) -->
            <div class="flex justify-between pt-6 border-t border-slate-100 print:hidden">
                <button 
                    onClick=${prevStep} 
                    disabled=${step === 0}
                    class="px-6 py-2 rounded-lg font-medium transition-colors ${step === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}"
                >
                    Back
                </button>

                ${step === steps.length - 1 ? html`
                    <button 
                        onClick=${() => window.print()}
                        class="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md flex items-center"
                    >
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Save / Print Report
                    </button>
                ` : html`
                    <button 
                        onClick=${nextStep}
                        class="px-8 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md"
                    >
                        Next Step →
                    </button>
                `}
            </div>
        </div>
    `;
}
