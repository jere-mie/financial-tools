import { html } from '../../vendor/standalone-preact.esm.js';

export const AssetsStep = ({ mode, spouse1, spouse2, assets, setAssets }) => {

    const addPolicy = () => {
        setAssets({
            ...assets,
            policies: [...assets.policies, { owner: 'spouse1', type: '', amount: 0 }]
        });
    };

    const removePolicy = (index) => {
        const newPolicies = assets.policies.filter((_, i) => i !== index);
        setAssets({ ...assets, policies: newPolicies });
    };

    const updatePolicy = (index, field, value) => {
        const newPolicies = [...assets.policies];
        newPolicies[index] = { ...newPolicies[index], [field]: value };
        setAssets({ ...assets, policies: newPolicies });
    };

    return html`
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold text-slate-800 mb-6">Existing Assets</h2>
            <p class="text-slate-600 mb-6">What financial resources do you already have that could offset the need for insurance?</p>
            
            <div class="space-y-8 max-w-4xl mx-auto">
                <!-- Liquid Assets -->
                <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 class="font-bold text-indigo-900 mb-4 flex items-center">
                        <span class="text-xl mr-2">💰</span> Liquid Assets
                    </h3>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Cash / Emergency Fund</label>
                            <div class="relative">
                                <span class="absolute left-3 top-2 text-slate-500">$</span>
                                <input type="number" value=${assets.cash} onInput=${e => setAssets({ ...assets, cash: Number(e.target.value) })} class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none" />
                            </div>
                            <p class="text-xs text-slate-500 mt-1">Bank accounts, GICs, etc.</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Investments</label>
                            <div class="relative">
                                <span class="absolute left-3 top-2 text-slate-500">$</span>
                                <input type="number" value=${assets.investments} onInput=${e => setAssets({ ...assets, investments: Number(e.target.value) })} class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none" />
                            </div>
                            <p class="text-xs text-slate-500 mt-1">TFSA, RRSP, Non-Registered</p>
                        </div>
                    </div>
                </div>

                <!-- Existing Insurance -->
                <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-indigo-900 flex items-center">
                            <span class="text-xl mr-2">🛡️</span> Existing Life Insurance
                        </h3>
                        <button onClick=${addPolicy} class="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200 transition-colors font-medium">+ Add Policy</button>
                    </div>
                    
                    <div class="space-y-3">
                        ${assets.policies.length === 0 && html`<p class="text-sm text-slate-400 italic">No existing policies added.</p>`}
                        
                        ${assets.policies.map((policy, index) => html`
                            <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative group">
                                <button onClick=${() => removePolicy(index)} class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors" title="Remove">×</button>
                                
                                <div class="grid md:grid-cols-3 gap-4">
                                    ${mode === 'joint' ? html`
                                        <div>
                                            <label class="block text-xs font-medium text-slate-600 mb-1">Owner</label>
                                            <select 
                                                value=${policy.owner} 
                                                onChange=${e => updatePolicy(index, 'owner', e.target.value)}
                                                class="w-full px-2 py-2 text-sm rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                                            >
                                                <option value="spouse1">${spouse1.name}</option>
                                                <option value="spouse2">${spouse2.name}</option>
                                            </select>
                                        </div>
                                    ` : html`
                                        <div class="hidden">
                                            <input type="hidden" value="spouse1" />
                                        </div>
                                    `}
                                    
                                    <div class="${mode === 'joint' ? '' : 'md:col-span-2'}">
                                        <label class="block text-xs font-medium text-slate-600 mb-1">Policy Type</label>
                                        <input 
                                            type="text" 
                                            value=${policy.type} 
                                            onInput=${e => updatePolicy(index, 'type', e.target.value)} 
                                            class="w-full px-3 py-2 text-sm rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none" 
                                            placeholder="Term, Whole Life, Group, etc."
                                        />
                                    </div>
                                    
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">Coverage Amount</label>
                                        <div class="relative">
                                            <span class="absolute left-2 top-2 text-slate-500 text-xs">$</span>
                                            <input 
                                                type="number" 
                                                value=${policy.amount} 
                                                onInput=${e => updatePolicy(index, 'amount', Number(e.target.value))} 
                                                class="w-full pl-6 pr-3 py-2 text-sm rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `)}
                    </div>
                </div>
            </div>
        </div>
    `;
};
