import { html, useState, useEffect } from '../vendor/standalone-preact.esm.js';

export function MortgageCalculator() {
    // State
    const [price, setPrice] = useState(500000);
    const [downPayment, setDownPayment] = useState(100000);
    const [rate, setRate] = useState(5.0);
    const [amortization, setAmortization] = useState(25);
    const [paymentFreq, setPaymentFreq] = useState('monthly');
    const [location, setLocation] = useState('ontario'); // 'ontario' or 'toronto'

    const [results, setResults] = useState({
        mortgageAmount: 0,
        cmhcInsurance: 0,
        totalMortgage: 0,
        payment: 0,
        landTransferTax: 0,
        provincialLTT: 0,
        municipalLTT: 0,
        cashNeeded: 0
    });

    // Constants
    const CMHC_RATES = [
        { min: 0.05, max: 0.0999, rate: 0.0400 },
        { min: 0.10, max: 0.1499, rate: 0.0310 },
        { min: 0.15, max: 0.1999, rate: 0.0280 },
        { min: 0.20, max: 1.0000, rate: 0.0000 },
    ];

    const calculateLTT = (value) => {
        let tax = 0;
        // Ontario LTT Brackets
        if (value > 2000000) {
            tax += (value - 2000000) * 0.025;
            value = 2000000;
        }
        if (value > 400000) {
            tax += (value - 400000) * 0.020;
            value = 400000;
        }
        if (value > 250000) {
            tax += (value - 250000) * 0.015;
            value = 250000;
        }
        if (value > 55000) {
            tax += (value - 55000) * 0.010;
            value = 55000;
        }
        if (value > 0) {
            tax += value * 0.005;
        }
        return tax;
    };

    const calculate = () => {
        const downPaymentPercent = downPayment / price;
        let cmhcRate = 0;

        // Find CMHC rate
        if (downPaymentPercent < 0.20) {
            const bracket = CMHC_RATES.find(b => downPaymentPercent >= b.min && downPaymentPercent <= b.max);
            if (bracket) cmhcRate = bracket.rate;
            // If down payment is less than 5%, technically not allowed, but we'll handle gracefully or assume 4%
            if (downPaymentPercent < 0.05) cmhcRate = 0.04;
        }

        const mortgageAmount = price - downPayment;
        const cmhcInsurance = downPaymentPercent < 0.20 ? mortgageAmount * cmhcRate : 0;
        const totalMortgage = mortgageAmount + cmhcInsurance;

        // Mortgage Payment Calculation
        // M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1 ]
        const annualRate = rate / 100;
        let periodicRate;
        let numberOfPayments;

        if (paymentFreq === 'monthly') {
            periodicRate = annualRate / 12;
            numberOfPayments = amortization * 12;
        } else if (paymentFreq === 'bi-weekly') {
            periodicRate = annualRate / 26;
            numberOfPayments = amortization * 26;
        } else { // accelerated bi-weekly roughly
            periodicRate = annualRate / 26;
            numberOfPayments = amortization * 26;
        }

        const payment = (totalMortgage * periodicRate * Math.pow(1 + periodicRate, numberOfPayments)) / (Math.pow(1 + periodicRate, numberOfPayments) - 1);

        // LTT
        const provincialLTT = calculateLTT(price);
        const municipalLTT = location === 'toronto' ? calculateLTT(price) : 0;
        const landTransferTax = provincialLTT + municipalLTT;

        const cashNeeded = downPayment + landTransferTax; // + other closing costs typically, but we'll stick to these

        setResults({
            mortgageAmount,
            cmhcInsurance,
            totalMortgage,
            payment: isNaN(payment) ? 0 : payment,
            landTransferTax,
            provincialLTT,
            municipalLTT,
            cashNeeded
        });
    };

    useEffect(() => {
        calculate();
    }, [price, downPayment, rate, amortization, paymentFreq, location]);

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
                <h1 class="text-4xl font-extrabold text-slate-800 mb-4">Ontario Mortgage Calculator</h1>
                <p class="text-xl text-slate-600">Estimate your monthly payments, Land Transfer Tax, and CMHC insurance.</p>
            </div>

            <div class="grid lg:grid-cols-3 gap-8">
                <!-- Inputs -->
                <div class="lg:col-span-2 space-y-6">
                    <div class="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
                        <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center">
                            <span class="text-2xl mr-3">🏠</span>
                            <h2 class="text-xl font-bold text-slate-800">Mortgage Details</h2>
                        </div>
                        
                        <div class="p-6 space-y-6">
                            <!-- Price & Down Payment -->
                            <div class="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block font-bold text-slate-700 mb-2">Purchase Price</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-2.5 text-slate-500">$</span>
                                        <input 
                                            type="number" 
                                            value=${price} 
                                            onInput=${(e) => setPrice(Number(e.target.value))}
                                            class="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label class="block font-bold text-slate-700 mb-2">Down Payment</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-2.5 text-slate-500">$</span>
                                        <input 
                                            type="number" 
                                            value=${downPayment} 
                                            onInput=${(e) => setDownPayment(Number(e.target.value))}
                                            class="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div class="text-xs text-slate-500 mt-1 text-right">
                                        ${((downPayment / price) * 100).toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            <!-- Rate & Amortization -->
                            <div class="grid md:grid-cols-2 gap-6">
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
                                <div>
                                    <label class="block font-bold text-slate-700 mb-2">Amortization (Years)</label>
                                    <select 
                                        value=${amortization} 
                                        onChange=${(e) => setAmortization(Number(e.target.value))}
                                        class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    >
                                        <option value="10">10 Years</option>
                                        <option value="15">15 Years</option>
                                        <option value="20">20 Years</option>
                                        <option value="25">25 Years</option>
                                        <option value="30">30 Years</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Location & Frequency -->
                            <div class="grid md:grid-cols-2 gap-6">
                                <div>
                                    <div class="flex items-center mb-2">
                                        <label class="block font-bold text-slate-700">Location</label>
                                        <${Tooltip} text="Toronto has an additional Municipal Land Transfer Tax equal to the Provincial tax." />
                                    </div>
                                    <select 
                                        value=${location} 
                                        onChange=${(e) => setLocation(e.target.value)}
                                        class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    >
                                        <option value="ontario">Ontario (Outside Toronto)</option>
                                        <option value="toronto">Toronto</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block font-bold text-slate-700 mb-2">Payment Frequency</label>
                                    <select 
                                        value=${paymentFreq} 
                                        onChange=${(e) => setPaymentFreq(e.target.value)}
                                        class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="bi-weekly">Bi-Weekly</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Results -->
                <div class="space-y-6">
                    <div class="bg-indigo-900 text-white rounded-xl shadow-xl p-8 sticky top-6">
                        <h3 class="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-2">Estimated Payment</h3>
                        <div class="text-5xl font-bold mb-2">
                            ${formatCurrency(results.payment)}
                        </div>
                        <div class="text-indigo-300 text-sm mb-8 capitalize">
                            ${paymentFreq}
                        </div>
                        
                        <div class="space-y-4 mb-8">
                            <div class="flex justify-between text-sm">
                                <span class="text-indigo-200">Mortgage Amount</span>
                                <span class="font-bold">${formatCurrency(results.mortgageAmount)}</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-indigo-200">CMHC Insurance</span>
                                <span class="font-bold">${formatCurrency(results.cmhcInsurance)}</span>
                            </div>
                            <div class="h-px bg-indigo-800 my-2"></div>
                            <div class="flex justify-between text-sm">
                                <span class="text-indigo-200">Total Mortgage</span>
                                <span class="font-bold text-white">${formatCurrency(results.totalMortgage)}</span>
                            </div>
                        </div>

                        <div class="bg-indigo-800/50 rounded-lg p-4 border border-indigo-700">
                            <h4 class="font-bold text-indigo-100 mb-3 text-sm uppercase flex items-center">
                                <span class="mr-2">💰</span> Closing Costs (Est.)
                            </h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-indigo-300">Land Transfer Tax</span>
                                    <span class="font-bold">${formatCurrency(results.landTransferTax)}</span>
                                </div>
                                ${location === 'toronto' ? html`
                                    <div class="flex justify-between text-xs pl-2 opacity-75">
                                        <span class="text-indigo-300">Provincial</span>
                                        <span>${formatCurrency(results.provincialLTT)}</span>
                                    </div>
                                    <div class="flex justify-between text-xs pl-2 opacity-75">
                                        <span class="text-indigo-300">Municipal</span>
                                        <span>${formatCurrency(results.municipalLTT)}</span>
                                    </div>
                                ` : ''}
                                <div class="h-px bg-indigo-700 my-2"></div>
                                <div class="flex justify-between font-bold">
                                    <span class="text-indigo-100">Cash Required</span>
                                    <span class="text-white">${formatCurrency(results.cashNeeded)}</span>
                                </div>
                                <p class="text-[10px] text-indigo-400 mt-1 text-right">Down Payment + LTT</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

             <div class="mt-12 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-500">
                <p class="font-semibold mb-1">Note:</p>
                <p>
                    This calculator provides estimates only. Actual mortgage payments and closing costs may vary. 
                    CMHC insurance is calculated for high-ratio mortgages (less than 20% down). 
                    Land Transfer Tax calculations are based on current Ontario and Toronto rates.
                </p>
            </div>
        </div>
    `;
}
