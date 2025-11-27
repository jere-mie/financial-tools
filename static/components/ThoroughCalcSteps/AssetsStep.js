import { html } from '../../vendor/standalone-preact.esm.js';

export const AssetsStep = ({ mode, spouse1, spouse2, assets, setAssets }) => html`
    <div class="space-y-6 animate-fade-in">
        <h2 class="text-2xl font-bold text-slate-800 mb-6">Existing Assets</h2>
        <p class="text-slate-600 mb-6">What financial resources do you already have that could offset the need for insurance?</p>
        
        <div class="space-y-6 max-w-xl mx-auto">
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Total Savings & Investments</label>
                <div class="relative">
                    <span class="absolute left-3 top-2 text-slate-500">$</span>
                    <input type="number" value=${assets.savings} onInput=${e => setAssets({ ...assets, savings: Number(e.target.value) })} class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
            </div>

            <div class="grid grid-cols-${mode === 'joint' ? '2' : '1'} gap-6">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">${spouse1.name}'s Existing Insurance</label>
                    <div class="relative">
                        <span class="absolute left-3 top-2 text-slate-500">$</span>
                        <input type="number" value=${assets.existingInsurance1} onInput=${e => setAssets({ ...assets, existingInsurance1: Number(e.target.value) })} class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none" />
                    </div>
                </div>
                ${mode === 'joint' && html`
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">${spouse2.name}'s Existing Insurance</label>
                    <div class="relative">
                        <span class="absolute left-3 top-2 text-slate-500">$</span>
                        <input type="number" value=${assets.existingInsurance2} onInput=${e => setAssets({ ...assets, existingInsurance2: Number(e.target.value) })} class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none" />
                    </div>
                </div>
                `}
            </div>
        </div>
    </div>
`;
