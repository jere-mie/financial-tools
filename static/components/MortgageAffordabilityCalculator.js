import { html, useState, useEffect } from '../vendor/standalone-preact.esm.js';

export function MortgageAffordabilityCalculator() {
    // State
    const [income1, setIncome1] = useState(80000);
    const [income2, setIncome2] = useState(0);
    const [isJoint, setIsJoint] = useState(false);
    const [debts, setDebts] = useState(500); // Monthly debts
    const [downPayment, setDownPayment] = useState(60000);
    const [rate, setRate] = useState(5.0);
    const [amortization, setAmortization] = useState(25);
    const [heating, setHeating] = useState(150);
    const [condoFees, setCondoFees] = useState(0);
    const [propertyTaxRate, setPropertyTaxRate] = useState(1.0); // % of price

    const [results, setResults] = useState({
        maxPrice: 0,
        maxMortgage: 0,
        monthlyPayment: 0,
        stressTestRate: 0,
        limitingFactor: '', // 'GDS', 'TDS', or 'Down Payment'
        gdsRatio: 0,
        tdsRatio: 0
    });

    const calculate = () => {
        const totalAnnualIncome = income1 + (isJoint ? income2 : 0);
        const monthlyIncome = totalAnnualIncome / 12;

        if (monthlyIncome === 0) {
            setResults({ ...results, maxPrice: 0, maxMortgage: 0 });
            return;
        }

        // 1. Stress Test Rate
        const stressTestRate = Math.max(rate + 2, 5.25);
        const monthlyStressRate = (stressTestRate / 100) / 12;
        const numberOfPayments = amortization * 12;

        // Mortgage Payment Factor (Payment per $1 of mortgage)
        const paymentFactor = (monthlyStressRate * Math.pow(1 + monthlyStressRate, numberOfPayments)) / (Math.pow(1 + monthlyStressRate, numberOfPayments) - 1);

        // 2. Calculate Max Allowed Monthly Housing Cost based on Ratios
        // GDS Max: 39% of Income
        // Cost = Mortgage + Tax + Heat + 0.5 * Condo
        const maxHousingGDS = monthlyIncome * 0.39;

        // TDS Max: 44% of Income
        // Cost = Mortgage + Tax + Heat + 0.5 * Condo + Other Debts
        const maxHousingTDS = (monthlyIncome * 0.44) - debts;

        const maxAllowedHousingCost = Math.min(maxHousingGDS, maxHousingTDS);
        const limitingRatio = maxHousingGDS < maxHousingTDS ? 'GDS (Income)' : 'TDS (Debts)';

        // 3. Solve for Max Price
        // HousingCost = (Price - Down) * Factor + (Price * TaxRate/12) + Heat + (Condo * 0.5)
        // MaxHousing - Heat - 0.5*Condo = Price * Factor - Down * Factor + Price * TaxRate/12
        // MaxHousing - Heat - 0.5*Condo + Down * Factor = Price * (Factor + TaxRate/12)
        // Price = (MaxHousing - Heat - 0.5*Condo + Down * Factor) / (Factor + TaxRate/12)

        const monthlyTaxRate = (propertyTaxRate / 100) / 12;
        const numerator = maxAllowedHousingCost - heating - (condoFees * 0.5) + (downPayment * paymentFactor);
        const denominator = paymentFactor + monthlyTaxRate;

        let maxPriceIncomeBased = numerator / denominator;

        if (maxPriceIncomeBased < 0) maxPriceIncomeBased = 0;

        // 4. Calculate Max Price based on Down Payment Rules
        let maxPriceDownPaymentBased = 0;

        // Rule 1: First 500k needs 5%
        // Rule 2: Next 500k needs 10%
        // Rule 3: Over 1M needs 20%

        // Inverse logic:
        // If Down < 25k (5% of 500k): MaxPrice = Down / 0.05
        // If Down < 200k (20% of 1M - wait, 5% of 500k = 25k. 10% of next 500k = 50k. Total down for 1M = 75k):
        // Wait, the rule is:
        // Price <= 500k: MinDown = 5%
        // Price > 500k: MinDown = 5% of 500k + 10% of (Price - 500k)
        // Price >= 1M: MinDown = 20% (Strictly speaking, if price is 1M+, sliding scale doesn't apply, must be 20%)

        // So:
        // If Down >= 200,000 (20% of 1M), they can afford 1M+. MaxPrice = Down / 0.20.
        // If Down >= 75,000 (Min down for 1M using sliding scale), but < 200,000:
        //    They are in the >1M zone? No, if price > 1M, MUST have 20%.
        //    So if they have 75k, they can buy 1M. If they have 199k, they can buy 1M (capped by 20% rule? No, 1M limit is a hard step).
        //    Actually, for properties >= 1M, down payment MUST be 20%.
        //    So if you have 100k, you CANNOT buy a 1.2M house. You are capped at 999,999 (sliding scale).
        //    Let's find the max price for the sliding scale zone (500k - 999,999).
        //    Down = 25000 + 0.10 * (Price - 500000)
        //    Price = (Down - 25000) / 0.10 + 500000.
        //    Let's check limits:
        //    If Down = 75,000 -> Price = 50,000 / 0.1 + 500k = 500k + 500k = 1M.
        //    So if Down is between 25k and 200k... wait.
        //    If I have 150k down.
        //    Scale: (150k - 25k)/0.1 + 500k = 1.25M + 500k = 1.75M.
        //    BUT, you can't buy >1M with <20%.
        //    So if calculated Price > 1M, and Down/Price < 0.20, then MaxPrice is capped at 999,999 (or strictly < 1M).
        //    UNLESS Down / 0.20 >= Price.

        // Let's simplify:
        // Potential Price A (Tier 1): Down / 0.05. (Valid if <= 500k)
        // Potential Price B (Tier 2): (Down - 25000)/0.10 + 500000. (Valid if > 500k and < 1M)
        // Potential Price C (Tier 3): Down / 0.20. (Valid if >= 1M)

        // We take the max valid one.
        if (downPayment < 25000) {
            maxPriceDownPaymentBased = downPayment / 0.05;
        } else if (downPayment < 200000) {
            // They have enough for >500k.
            // Can they reach 1M?
            // With 75k, they reach 1M.
            // With 199k, they reach 1M (sliding scale allows huge price, but 1M cap applies if <20%).
            // Actually, if Price >= 1M, need 20%.
            // So if Down < 200k, Max Price is strictly < 1M (or 999,999).
            // But wait, sliding scale allows up to 1M.
            // So calculate sliding scale price. If > 1M, cap at 999,999.
            let p = (downPayment - 25000) / 0.10 + 500000;
            if (p >= 1000000) p = 999999;
            maxPriceDownPaymentBased = p;
        } else {
            // Down >= 200k.
            // They can do 20% down.
            maxPriceDownPaymentBased = downPayment / 0.20;
        }

        // Final Max Price
        let finalMaxPrice = Math.min(maxPriceIncomeBased, maxPriceDownPaymentBased);
        let finalLimitingFactor = maxPriceIncomeBased < maxPriceDownPaymentBased ? limitingRatio : 'Down Payment';

        // Recalculate Mortgage and Payment for the Final Price
        const finalMortgage = finalMaxPrice - downPayment;

        // Real Payment (at Contract Rate, not Stress Rate)
        const monthlyContractRate = (rate / 100) / 12;
        const realPayment = (finalMortgage * monthlyContractRate * Math.pow(1 + monthlyContractRate, numberOfPayments)) / (Math.pow(1 + monthlyContractRate, numberOfPayments) - 1);

        // Calculate actual Ratios for display
        const monthlyTax = (finalMaxPrice * monthlyTaxRate);
        const housingCost = realPayment + monthlyTax + heating + (condoFees * 0.5); // Note: GDS usually uses Stress Payment or Contract? 
        // CMHC says: "GDS is the percentage of your monthly household income that covers your housing costs."
        // AND "You must use the higher of the contract rate + 2% or 5.25%".
        // So the Ratios displayed should be based on the STRESS payment to be accurate to the limit.

        const stressPayment = (finalMortgage * monthlyStressRate * Math.pow(1 + monthlyStressRate, numberOfPayments)) / (Math.pow(1 + monthlyStressRate, numberOfPayments) - 1);
        const stressHousingCost = stressPayment + monthlyTax + heating + (condoFees * 0.5);

        const finalGDS = (stressHousingCost / monthlyIncome) * 100;
        const finalTDS = ((stressHousingCost + debts) / monthlyIncome) * 100;

        setResults({
            maxPrice: finalMaxPrice,
            maxMortgage: finalMortgage,
            monthlyPayment: isNaN(realPayment) ? 0 : realPayment,
            stressTestRate,
            limitingFactor: finalLimitingFactor,
            gdsRatio: finalGDS,
            tdsRatio: finalTDS
        });
    };

    useEffect(() => {
        calculate();
    }, [income1, income2, isJoint, debts, downPayment, rate, amortization, heating, condoFees, propertyTaxRate]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);
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
        <div class="max-w-6xl mx-auto p-6">
            <div class="text-center mb-10">
                <h1 class="text-4xl font-extrabold text-slate-800 mb-4">Mortgage Affordability Calculator</h1>
                <p class="text-xl text-slate-600">Find out how much home you can afford based on your income and Canadian stress test rules.</p>
            </div>

            <div class="grid lg:grid-cols-3 gap-8">
                <!-- Inputs -->
                <div class="lg:col-span-2 space-y-6">
                    
                    <!-- Income Section -->
                    <div class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
                        <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div class="flex items-center">
                                <span class="text-2xl mr-3">💰</span>
                                <h2 class="text-xl font-bold text-slate-800">Income & Debts</h2>
                            </div>
                            <div class="flex items-center space-x-2 text-sm">
                                <label class="font-medium text-slate-700">Joint Application?</label>
                                <input 
                                    type="checkbox" 
                                    checked=${isJoint} 
                                    onChange=${(e) => setIsJoint(e.target.checked)}
                                    class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                />
                            </div>
                        </div>
                        
                        <div class="p-6 space-y-6">
                            <div class="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block font-bold text-slate-700 mb-2">Annual Income (Applicant 1)</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-2.5 text-slate-500">$</span>
                                        <input 
                                            type="number" 
                                            value=${income1} 
                                            onInput=${(e) => setIncome1(Number(e.target.value))}
                                            class="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                                ${isJoint ? html`
                                    <div>
                                        <label class="block font-bold text-slate-700 mb-2">Annual Income (Applicant 2)</label>
                                        <div class="relative">
                                            <span class="absolute left-3 top-2.5 text-slate-500">$</span>
                                            <input 
                                                type="number" 
                                                value=${income2} 
                                                onInput=${(e) => setIncome2(Number(e.target.value))}
                                                class="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                ` : ''}
                            </div>

                            <div>
                                <div class="flex items-center mb-2">
                                    <label class="block font-bold text-slate-700">Monthly Debts</label>
                                    <${Tooltip} text="Total monthly payments for credit cards, car loans, student loans, and lines of credit." />
                                </div>
                                <div class="relative">
                                    <span class="absolute left-3 top-2.5 text-slate-500">$</span>
                                    <input 
                                        type="number" 
                                        value=${debts} 
                                        onInput=${(e) => setDebts(Number(e.target.value))}
                                        class="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Mortgage Details -->
                    <div class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
                        <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center">
                            <span class="text-2xl mr-3">🏠</span>
                            <h2 class="text-xl font-bold text-slate-800">Mortgage & Property</h2>
                        </div>
                        
                        <div class="p-6 space-y-6">
                            <div class="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block font-bold text-slate-700 mb-2">Down Payment Available</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-2.5 text-slate-500">$</span>
                                        <input 
                                            type="number" 
                                            value=${downPayment} 
                                            onInput=${(e) => setDownPayment(Number(e.target.value))}
                                            class="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label class="block font-bold text-slate-700 mb-2">Interest Rate (%)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value=${rate} 
                                        onInput=${(e) => setRate(Number(e.target.value))}
                                        class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div class="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label class="block font-bold text-slate-700 mb-2">Amortization</label>
                                    <select 
                                        value=${amortization} 
                                        onChange=${(e) => setAmortization(Number(e.target.value))}
                                        class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    >
                                        <option value="25">25 Years</option>
                                        <option value="30">30 Years</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block font-bold text-slate-700 mb-2">Monthly Heating</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-2.5 text-slate-500">$</span>
                                        <input 
                                            type="number" 
                                            value=${heating} 
                                            onInput=${(e) => setHeating(Number(e.target.value))}
                                            class="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label class="block font-bold text-slate-700 mb-2">Monthly Condo Fees</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-2.5 text-slate-500">$</span>
                                        <input 
                                            type="number" 
                                            value=${condoFees} 
                                            onInput=${(e) => setCondoFees(Number(e.target.value))}
                                            class="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex items-center justify-end">
                                <label class="text-sm text-slate-500 mr-2">Est. Property Tax Rate:</label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    value=${propertyTaxRate} 
                                    onInput=${(e) => setPropertyTaxRate(Number(e.target.value))}
                                    class="w-16 px-2 py-1 border border-slate-300 rounded text-sm text-right"
                                />
                                <span class="text-sm text-slate-500 ml-1">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Results -->
                <div class="space-y-6">
                    <div class="bg-indigo-900 text-white rounded-xl shadow-xl p-8 sticky top-6">
                        <h3 class="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-2">Maximum Affordability</h3>
                        <div class="text-4xl font-bold mb-1">
                            ${formatCurrency(results.maxPrice)}
                        </div>
                        <div class="text-indigo-300 text-xs mb-8">
                            Max Purchase Price
                        </div>
                        
                        <div class="space-y-4 mb-8">
                            <div class="flex justify-between text-sm">
                                <span class="text-indigo-200">Max Mortgage</span>
                                <span class="font-bold">${formatCurrency(results.maxMortgage)}</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-indigo-200">Down Payment</span>
                                <span class="font-bold">${formatCurrency(downPayment)}</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-indigo-200">Est. Monthly Payment</span>
                                <span class="font-bold">${formatCurrency(results.monthlyPayment)}</span>
                            </div>
                        </div>

                        <div class="bg-indigo-800/50 rounded-lg p-4 border border-indigo-700 mb-6">
                            <h4 class="font-bold text-indigo-100 mb-3 text-sm uppercase">Qualification Details</h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-indigo-300">Stress Test Rate</span>
                                    <span class="font-bold">${results.stressTestRate.toFixed(2)}%</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-indigo-300">Limiting Factor</span>
                                    <span class="font-bold text-yellow-300">${results.limitingFactor}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 class="font-bold text-indigo-100 mb-3 text-sm uppercase">Debt Service Ratios</h4>
                            <div class="space-y-4">
                                <div>
                                    <div class="flex justify-between text-xs mb-1">
                                        <span class="text-indigo-200">GDS (Max 39%)</span>
                                        <span class="${results.gdsRatio > 39 ? 'text-red-400' : 'text-green-400'} font-bold">${results.gdsRatio.toFixed(1)}%</span>
                                    </div>
                                    <div class="w-full bg-indigo-950 rounded-full h-2">
                                        <div class="bg-indigo-400 h-2 rounded-full" style="width: ${Math.min(results.gdsRatio, 100)}%"></div>
                                    </div>
                                </div>
                                <div>
                                    <div class="flex justify-between text-xs mb-1">
                                        <span class="text-indigo-200">TDS (Max 44%)</span>
                                        <span class="${results.tdsRatio > 44 ? 'text-red-400' : 'text-green-400'} font-bold">${results.tdsRatio.toFixed(1)}%</span>
                                    </div>
                                    <div class="w-full bg-indigo-950 rounded-full h-2">
                                        <div class="bg-indigo-400 h-2 rounded-full" style="width: ${Math.min(results.tdsRatio, 100)}%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-12 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-500">
                <p class="font-semibold mb-1">How is this calculated?</p>
                <p>
                    We use the standard Canadian GDS (Gross Debt Service) and TDS (Total Debt Service) ratios of 39% and 44%. 
                    Calculations include a stress test rate of either your rate + 2% or 5.25% (whichever is higher). 
                    Property tax is estimated at ${propertyTaxRate}% of the purchase price.
                </p>
            </div>
        </div>
    `;
}
