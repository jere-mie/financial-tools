import { html } from '../../vendor/standalone-preact.esm.js';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export const ReportStep = ({ mode, spouse1, spouse2, liabilities, children, assets, results }) => html`
    <div class="animate-fade-in print:animate-none print:m-0 print:p-0">
        <div class="bg-white p-8 print:p-2 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:rounded-none">
            <div class="text-center border-b border-slate-200 print:border-none pb-6 mb-8 print:pb-1 print:mb-2">
                <h2 class="text-3xl font-bold text-slate-800 mb-2 print:text-lg print:mb-1">Life Insurance Needs Analysis</h2>
                <p class="text-slate-500 print:text-xs">Prepared on ${new Date().toLocaleDateString()}</p>
            </div>

            <!-- Client Profile Section -->
            <div class="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 print:bg-white print:border-slate-300 print:p-3 print:mb-4">
                <h3 class="text-base font-bold text-slate-800 mb-3 uppercase tracking-wide border-b border-slate-300 pb-2">Client Profile</h3>
                
                <div class="grid ${mode === 'joint' ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-4 mb-3">
                    <!-- Spouse 1 -->
                    <div>
                        <h4 class="font-bold text-indigo-900 mb-2 text-sm">${spouse1.name}</h4>
                        <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                            <div><span class="text-slate-500">DOB:</span> <span class="font-medium">${spouse1.dob || 'Not provided'}</span></div>
                            <div><span class="text-slate-500">Smoker:</span> <span class="font-medium ${spouse1.smoker ? 'text-red-600' : 'text-green-600'}">${spouse1.smoker ? 'Yes' : 'No'}</span></div>
                            <div><span class="text-slate-500">Email:</span> <span class="font-medium truncate">${spouse1.email || 'Not provided'}</span></div>
                            <div><span class="text-slate-500">Phone:</span> <span class="font-medium">${spouse1.phone || 'Not provided'}</span></div>
                            <div class="col-span-2 pt-1 border-t border-slate-200 mt-1">
                                <span class="text-slate-500">Income:</span> <span class="font-bold text-indigo-700">${formatCurrency(spouse1.income)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Spouse 2 -->
                    ${mode === 'joint' && html`
                    <div>
                        <h4 class="font-bold text-indigo-900 mb-2 text-sm">${spouse2.name}</h4>
                        <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                            <div><span class="text-slate-500">DOB:</span> <span class="font-medium">${spouse2.dob || 'Not provided'}</span></div>
                            <div><span class="text-slate-500">Smoker:</span> <span class="font-medium ${spouse2.smoker ? 'text-red-600' : 'text-green-600'}">${spouse2.smoker ? 'Yes' : 'No'}</span></div>
                            <div><span class="text-slate-500">Email:</span> <span class="font-medium truncate">${spouse2.email || 'Not provided'}</span></div>
                            <div><span class="text-slate-500">Phone:</span> <span class="font-medium">${spouse2.phone || 'Not provided'}</span></div>
                            <div class="col-span-2 pt-1 border-t border-slate-200 mt-1">
                                <span class="text-slate-500">Income:</span> <span class="font-bold text-indigo-700">${formatCurrency(spouse2.income)}</span>
                            </div>
                        </div>
                    </div>
                    `}
                </div>

                ${children.length > 0 && html`
                <div class="border-t border-slate-300 pt-3 mt-3">
                    <h4 class="font-bold text-slate-700 mb-2 text-xs uppercase tracking-wide">Children & Education</h4>
                    <table class="w-full text-xs">
                        <thead class="border-b border-slate-200">
                            <tr class="text-slate-600">
                                <th class="text-left py-1 font-semibold">Name</th>
                                <th class="text-left py-1 font-semibold">DOB</th>
                                <th class="text-right py-1 font-semibold">Est. Education Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${children.map(child => html`
                                <tr class="border-b border-slate-100">
                                    <td class="py-1 font-medium">${child.name || 'Child'}</td>
                                    <td class="py-1 text-slate-600">${child.dob || 'Not provided'}</td>
                                    <td class="py-1 text-right font-semibold">${formatCurrency(child.cost)}</td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                </div>
                `}

                <div class="grid md:grid-cols-2 gap-4 border-t border-slate-300 pt-3 mt-3">
                    <div>
                        <h4 class="font-bold text-slate-700 mb-2 text-xs uppercase tracking-wide">Liabilities</h4>
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between">
                                <span class="text-slate-600">Mortgage:</span>
                                <span class="font-semibold">${formatCurrency(liabilities.mortgage)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-600">Other Debts:</span>
                                <span class="font-semibold">${formatCurrency(liabilities.debts)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-600">Final Expenses:</span>
                                <span class="font-semibold">${formatCurrency(liabilities.finalExpenses)}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-slate-700 mb-2 text-xs uppercase tracking-wide">Assets</h4>
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between">
                                <span class="text-slate-600">Cash/Savings:</span>
                                <span class="font-semibold">${formatCurrency(assets.cash)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-600">Investments:</span>
                                <span class="font-semibold">${formatCurrency(assets.investments)}</span>
                            </div>
                            
                            ${assets.policies.filter(p => p.owner === 'spouse1').length > 0 && html`
                                <div class="pt-1 mt-1 border-t border-slate-100">
                                    <p class="text-slate-700 font-semibold mb-0.5">${spouse1.name} Insurance:</p>
                                    ${assets.policies.filter(p => p.owner === 'spouse1').map(p => html`
                                        <div class="flex justify-between pl-2">
                                            <span class="text-slate-500">${p.type || 'Policy'}:</span>
                                            <span class="font-medium">${formatCurrency(p.amount)}</span>
                                        </div>
                                    `)}
                                </div>
                            `}

                            ${mode === 'joint' && assets.policies.filter(p => p.owner === 'spouse2').length > 0 && html`
                                <div class="pt-1 mt-1 border-t border-slate-100">
                                    <p class="text-slate-700 font-semibold mb-0.5">${spouse2.name} Insurance:</p>
                                    ${assets.policies.filter(p => p.owner === 'spouse2').map(p => html`
                                        <div class="flex justify-between pl-2">
                                            <span class="text-slate-500">${p.type || 'Policy'}:</span>
                                            <span class="font-medium">${formatCurrency(p.amount)}</span>
                                        </div>
                                    `)}
                                </div>
                            `}
                        </div>
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

            <div class="mt-12 print:mt-4 print:mb-0 text-sm print:text-xs text-slate-500 text-center border-t border-slate-100 pt-6 print:pt-3 print:border-t-0">
                <p class="font-semibold mb-1 print:mb-0.5">Disclaimer for Ontario Residents:</p>
                <p class="mb-0 print:m-0">This report is for illustrative purposes only and does not constitute financial advice. Results are estimates based on the information provided. Residents of Ontario should consult with a licensed life insurance advisor for a personalized needs analysis.</p>
            </div>
        </div>
    </div>
`;
