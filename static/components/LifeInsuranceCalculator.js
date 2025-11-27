import { html, useState, useEffect } from '../vendor/standalone-preact.esm.js';

export function LifeInsuranceCalculator() {
    const [income, setIncome] = useState(50000);
    const [years, setYears] = useState(10);
    const [debt, setDebt] = useState(15000);
    const [mortgage, setMortgage] = useState(250000);
    const [education, setEducation] = useState(50000);
    const [savings, setSavings] = useState(20000);
    const [existingInsurance, setExistingInsurance] = useState(0);
    const [result, setResult] = useState({ totalNeeds: 0, totalAssets: 0, gap: 0, breakdown: {} });

    const calculate = () => {
        const incomeReplacement = income * years;
        const totalNeeds = debt + incomeReplacement + mortgage + education;
        const totalAssets = savings + existingInsurance;
        const gap = totalNeeds - totalAssets;

        setResult({
            totalNeeds,
            totalAssets,
            gap,
            breakdown: {
                debt,
                income: incomeReplacement,
                mortgage,
                education
            }
        });
    };

    useEffect(() => {
        calculate();
    }, [income, years, debt, mortgage, education, savings, existingInsurance]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    };

    const Tooltip = ({ text }) => html`
        <div class="group relative inline-block ml-2">
            <span class="cursor-help text-indigo-400 hover:text-indigo-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </span>
            <div class="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl transition-all duration-200 z-10 pointer-events-none">
                ${text}
                <div class="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
            </div>
        </div>
    `;

    return html`
        <div class="max-w-5xl mx-auto p-6">
            <div class="text-center mb-10">
                <h1 class="text-4xl font-extrabold text-slate-800 mb-4">Quick Life Insurance Needs Estimator</h1>
                <p class="text-xl text-slate-600">Calculate your coverage using the <span class="font-bold text-indigo-600">DIME</span> Method in under 2 minutes.</p>
            </div>

            <!-- Educational Section -->
            <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-8">
                <h2 class="text-lg font-bold text-indigo-900 mb-4">What is the DIME Method?</h2>
                <div class="grid md:grid-cols-4 gap-4">
                    <div class="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
                        <div class="text-2xl mb-2">💳</div>
                        <h3 class="font-bold text-indigo-800">Debt</h3>
                        <p class="text-sm text-slate-600">Consumer debts like credit cards, car loans, and personal loans.</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
                        <div class="text-2xl mb-2">💰</div>
                        <h3 class="font-bold text-indigo-800">Income</h3>
                        <p class="text-sm text-slate-600">Income replacement to support your family for a set number of years.</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
                        <div class="text-2xl mb-2">🏠</div>
                        <h3 class="font-bold text-indigo-800">Mortgage</h3>
                        <p class="text-sm text-slate-600">The remaining balance on your home mortgage.</p>
                    </div>
                    <div class="bg-white p-4 rounded-lg shadow-sm border border-indigo-100">
                        <div class="text-2xl mb-2">🎓</div>
                        <h3 class="font-bold text-indigo-800">Education</h3>
                        <p class="text-sm text-slate-600">Future education costs for your children.</p>
                    </div>
                </div>
            </div>

            <div class="grid lg:grid-cols-3 gap-8">
                <!-- Input Section -->
                <div class="lg:col-span-2 space-y-6">
                    
                    <!-- DIME Inputs -->
                    <div class="bg-white rounded-xl shadow-md border border-slate-100">
                        <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center">
                            <span class="text-2xl mr-3">📝</span>
                            <h2 class="text-xl font-bold text-slate-800">Calculate Your Needs</h2>
                        </div>
                        
                        <div class="p-6 space-y-8">
                            <!-- Debt -->
                            <div class="grid md:grid-cols-12 gap-4 items-start">
                                <div class="md:col-span-4">
                                    <label class="block font-bold text-slate-700 mb-1">Debt</label>
                                    <p class="text-xs text-slate-500">Credit cards, car loans, etc.</p>
                                </div>
                                <div class="md:col-span-8">
                                    <div class="relative">
                                        <span class="absolute left-3 top-2.5 text-slate-500">$</span>
                                        <input 
                                            type="number" 
                                            value=${debt} 
                                            onInput=${(e) => setDebt(Number(e.target.value))}
                                            class="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <!-- Income -->
                            <div class="grid md:grid-cols-12 gap-4 items-start border-t border-slate-100 pt-6">
                                <div class="md:col-span-4">
                                    <label class="block font-bold text-slate-700 mb-1">Income</label>
                                    <p class="text-xs text-slate-500">Annual income & years to replace.</p>
                                </div>
                                <div class="md:col-span-8 grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">Annual Income</label>
                                        <div class="relative">
                                            <span class="absolute left-3 top-2.5 text-slate-500">$</span>
                                            <input 
                                                type="number" 
                                                value=${income} 
                                                onInput=${(e) => setIncome(Number(e.target.value))}
                                                class="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex items-center mb-1">
                                            <label class="block text-xs font-medium text-slate-600">Years</label>
                                            <${Tooltip} text="Experts typically recommend 7-12 years of income replacement, or enough to cover expenses until your youngest child is independent." />
                                        </div>
                                        <input 
                                            type="number" 
                                            value=${years} 
                                            onInput=${(e) => setYears(Number(e.target.value))}
                                            class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <!-- Mortgage -->
                            <div class="grid md:grid-cols-12 gap-4 items-start border-t border-slate-100 pt-6">
                                <div class="md:col-span-4">
                                    <label class="block font-bold text-slate-700 mb-1">Mortgage</label>
                                    <p class="text-xs text-slate-500">Remaining mortgage balance.</p>
                                </div>
                                <div class="md:col-span-8">
                                    <div class="relative">
                                        <span class="absolute left-3 top-2.5 text-slate-500">$</span>
                                        <input 
                                            type="number" 
                                            value=${mortgage} 
                                            onInput=${(e) => setMortgage(Number(e.target.value))}
                                            class="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <!-- Education -->
                            <div class="grid md:grid-cols-12 gap-4 items-start border-t border-slate-100 pt-6">
                                <div class="md:col-span-4">
                                    <div class="flex items-center">
                                        <label class="block font-bold text-slate-700 mb-1 mr-1">Education</label>
                                        <${Tooltip} text="For Ontario, estimate approx. $60,000 per child for a 4-year university degree (tuition + residence). Reduce this if living at home." />
                                    </div>
                                    <p class="text-xs text-slate-500">Estimated college costs.</p>
                                </div>
                                <div class="md:col-span-8">
                                    <div class="relative">
                                        <span class="absolute left-3 top-2.5 text-slate-500">$</span>
                                        <input 
                                            type="number" 
                                            value=${education} 
                                            onInput=${(e) => setEducation(Number(e.target.value))}
                                            class="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Assets -->
                    <div class="bg-white rounded-xl shadow-md border border-slate-100">
                         <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center">
                            <span class="text-2xl mr-3">🏦</span>
                            <h2 class="text-xl font-bold text-slate-800">Existing Assets</h2>
                        </div>
                        <div class="p-6 grid md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Savings & Investments</label>
                                <div class="relative">
                                    <span class="absolute left-3 top-2.5 text-slate-500">$</span>
                                    <input 
                                        type="number" 
                                        value=${savings} 
                                        onInput=${(e) => setSavings(Number(e.target.value))}
                                        class="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Existing Life Insurance</label>
                                <div class="relative">
                                    <span class="absolute left-3 top-2.5 text-slate-500">$</span>
                                    <input 
                                        type="number" 
                                        value=${existingInsurance} 
                                        onInput=${(e) => setExistingInsurance(Number(e.target.value))}
                                        class="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Results Section -->
                <div class="space-y-6">
                    <div class="bg-indigo-900 text-white rounded-xl shadow-xl p-8 sticky top-6">
                        <h3 class="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-2">Estimated Insurance Gap</h3>
                        <div class="text-5xl font-bold mb-6 ${result.gap > 0 ? 'text-white' : 'text-green-400'}">
                            ${formatCurrency(Math.max(0, result.gap))}
                        </div>
                        
                        <div class="space-y-3 mb-6">
                            <div class="flex justify-between text-sm text-indigo-200">
                                <span>Total DIME Needs</span>
                                <span class="font-bold text-white">${formatCurrency(result.totalNeeds)}</span>
                            </div>
                            <div class="flex justify-between text-sm text-indigo-200">
                                <span>Minus Assets</span>
                                <span class="font-bold text-white">-${formatCurrency(result.totalAssets)}</span>
                            </div>
                        </div>

                        <div class="h-px bg-indigo-800 mb-6"></div>

                        <h4 class="font-bold text-indigo-300 mb-3 text-sm uppercase">Breakdown</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-indigo-100">Debt</span>
                                <span>${formatCurrency(result.breakdown.debt)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-indigo-100">Income</span>
                                <span>${formatCurrency(result.breakdown.income)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-indigo-100">Mortgage</span>
                                <span>${formatCurrency(result.breakdown.mortgage)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-indigo-100">Education</span>
                                <span>${formatCurrency(result.breakdown.education)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-12 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-500">
                <p class="font-semibold mb-1">Disclaimer for Ontario Residents:</p>
                <p>
                    This calculator is for illustrative purposes only and does not constitute financial advice. 
                    Results are estimates based on the information provided. 
                    Residents of Ontario should consult with a licensed life insurance advisor for a personalized needs analysis.
                </p>
            </div>
        </div>
    `;
}
