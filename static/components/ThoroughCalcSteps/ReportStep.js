import { html } from '../../vendor/standalone-preact.esm.js';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export const ReportStep = ({ mode, spouse1, spouse2, liabilities, children, assets, results }) => html`
    <div class="animate-fade-in print:animate-none">
        <div class="bg-white p-8 print:p-4 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0">
            <div class="text-center border-b border-slate-200 pb-6 mb-8">
                <h2 class="text-3xl font-bold text-slate-800 mb-2">Life Insurance Needs Analysis</h2>
                <p class="text-slate-500">Prepared on ${new Date().toLocaleDateString()}</p>
            </div>

            <!-- Client Profile Section -->
            <div class="mb-8 bg-slate-50 p-6 rounded-lg border border-slate-200 print:bg-transparent print:border print:border-slate-300 page-break-after">
                <h3 class="text-lg font-bold text-slate-800 mb-4 uppercase tracking-wide border-b border-slate-200 pb-2">Client Profile</h3>
                
                <div class="grid grid-cols-2 gap-8 mb-6">
                    <div>
                        <h4 class="font-bold text-indigo-900 mb-2">${spouse1.name}</h4>
                        <div class="text-sm text-slate-600 space-y-1">
                            <p><span class="font-medium">DOB:</span> ${spouse1.dob || 'Not provided'}</p>
                            <p><span class="font-medium">Email:</span> ${spouse1.email || 'Not provided'}</p>
                            <p><span class="font-medium">Phone:</span> ${spouse1.phone || 'Not provided'}</p>
                            <p><span class="font-medium">Income:</span> ${formatCurrency(spouse1.income)}</p>
                        </div>
                    </div>
                    ${mode === 'joint' && html`
                    <div>
                        <h4 class="font-bold text-indigo-900 mb-2">${spouse2.name}</h4>
                        <div class="text-sm text-slate-600 space-y-1">
                            <p><span class="font-medium">DOB:</span> ${spouse2.dob || 'Not provided'}</p>
                            <p><span class="font-medium">Email:</span> ${spouse2.email || 'Not provided'}</p>
                            <p><span class="font-medium">Phone:</span> ${spouse2.phone || 'Not provided'}</p>
                            <p><span class="font-medium">Income:</span> ${formatCurrency(spouse2.income)}</p>
                        </div>
                    </div>
                    `}
                </div>

                ${children.length > 0 && html`
                <div class="mb-6">
                    <h4 class="font-bold text-slate-700 mb-2 text-sm">Children</h4>
                    <table class="w-full text-sm text-left">
                        <thead class="bg-slate-100 text-slate-600">
                            <tr>
                                <th class="p-2 rounded-l">Name</th>
                                <th class="p-2">DOB</th>
                                <th class="p-2 rounded-r">Est. Education Cost</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200">
                            ${children.map(child => html`
                                <tr>
                                    <td class="p-2 font-medium">${child.name || 'Child'}</td>
                                    <td class="p-2">${child.dob || 'Not provided'}</td>
                                    <td class="p-2">${formatCurrency(child.cost)}</td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                </div>
                `}

                <div class="grid grid-cols-2 gap-8 text-sm">
                    <div>
                        <h4 class="font-bold text-slate-700 mb-1">Liabilities</h4>
                        <p class="text-slate-600">Mortgage: ${formatCurrency(liabilities.mortgage)}</p>
                        <p class="text-slate-600">Other Debts: ${formatCurrency(liabilities.debts)}</p>
                        <p class="text-slate-600">Final Expenses: ${formatCurrency(liabilities.finalExpenses)}</p>
                    </div>
                    <div>
                        <h4 class="font-bold text-slate-700 mb-1">Assets</h4>
                        <p class="text-slate-600">Savings: ${formatCurrency(assets.savings)}</p>
                        <p class="text-slate-600">${spouse1.name} Insurance: ${formatCurrency(assets.existingInsurance1)}</p>
                        ${mode === 'joint' && html`<p class="text-slate-600">${spouse2.name} Insurance: ${formatCurrency(assets.existingInsurance2)}</p>`}
                    </div>
                </div>
            </div>

            <div class="grid md:grid-cols-${mode === 'joint' ? '2' : '1'} gap-12 print:gap-4 print:compact">
                <!-- Spouse 1 Report -->
                <div class="space-y-6 print:space-y-3">
                    <h3 class="text-xl font-bold text-indigo-900 border-b-2 border-indigo-100 pb-2">Needs Analysis for ${spouse1.name}</h3>
                    
                    <div class="space-y-3 print:space-y-1">
                        <div class="flex justify-between text-slate-600">
                            <span>Income Replacement (${spouse1.years} yrs)</span>
                            <span class="font-medium">${formatCurrency(spouse1.income * spouse1.years)}</span>
                        </div>
                        <div class="flex justify-between text-slate-600">
                            <span>Mortgage & Debts</span>
                            <span class="font-medium">${formatCurrency(liabilities.mortgage + liabilities.debts + liabilities.finalExpenses)}</span>
                        </div>
                        <div class="flex justify-between text-slate-600">
                            <span>Education Fund</span>
                            <span class="font-medium">${formatCurrency(results.totalEducationCost)}</span>
                        </div>
                        <div class="h-px bg-slate-200 my-2"></div>
                        <div class="flex justify-between font-bold text-slate-800">
                            <span>Total Needs</span>
                            <span>${formatCurrency(results.spouse1.needs)}</span>
                        </div>
                        <div class="flex justify-between text-green-600">
                            <span>Existing Assets & Insurance</span>
                            <span>-${formatCurrency(results.spouse1.assets)}</span>
                        </div>
                        <div class="h-px bg-slate-200 my-2"></div>
                        <div class="bg-indigo-50 p-4 print:p-2 rounded-lg border border-indigo-100">
                            <div class="flex justify-between items-center">
                                <span class="font-bold text-indigo-900 print:text-sm">Recommended Coverage</span>
                                <span class="text-2xl print:text-xl font-bold text-indigo-700">${formatCurrency(results.spouse1.gap)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Spouse 2 Report -->
                ${mode === 'joint' && html`
                <div class="space-y-6 print:space-y-3">
                    <h3 class="text-xl font-bold text-indigo-900 border-b-2 border-indigo-100 pb-2">Needs Analysis for ${spouse2.name}</h3>
                    
                    <div class="space-y-3 print:space-y-1">
                        <div class="flex justify-between text-slate-600">
                            <span>Income Replacement (${spouse2.years} yrs)</span>
                            <span class="font-medium">${formatCurrency(spouse2.income * spouse2.years)}</span>
                        </div>
                        <div class="flex justify-between text-slate-600">
                            <span>Mortgage & Debts</span>
                            <span class="font-medium">${formatCurrency(liabilities.mortgage + liabilities.debts + liabilities.finalExpenses)}</span>
                        </div>
                        <div class="flex justify-between text-slate-600">
                            <span>Education Fund</span>
                            <span class="font-medium">${formatCurrency(results.totalEducationCost)}</span>
                        </div>
                        <div class="h-px bg-slate-200 my-2"></div>
                        <div class="flex justify-between font-bold text-slate-800">
                            <span>Total Needs</span>
                            <span>${formatCurrency(results.spouse2.needs)}</span>
                        </div>
                        <div class="flex justify-between text-green-600">
                            <span>Existing Assets & Insurance</span>
                            <span>-${formatCurrency(results.spouse2.assets)}</span>
                        </div>
                        <div class="h-px bg-slate-200 my-2"></div>
                        <div class="bg-indigo-50 p-4 print:p-2 rounded-lg border border-indigo-100">
                            <div class="flex justify-between items-center">
                                <span class="font-bold text-indigo-900 print:text-sm">Recommended Coverage</span>
                                <span class="text-2xl print:text-xl font-bold text-indigo-700">${formatCurrency(results.spouse2.gap)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                `}
            </div>

            <div class="mt-12 print:mt-2 print:mb-0 text-sm print:text-xs text-slate-500 text-center border-t border-slate-100 pt-6 print:pt-2">
                <p class="font-semibold mb-1">Disclaimer for Ontario Residents:</p>
                <p class="mb-0">This report is for illustrative purposes only and does not constitute financial advice. Results are estimates based on the information provided. Residents of Ontario should consult with a licensed life insurance advisor for a personalized needs analysis.</p>
            </div>
        </div>
    </div>
`;
