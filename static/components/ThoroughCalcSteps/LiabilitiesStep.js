import { html } from '../../vendor/standalone-preact.esm.js';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export const LiabilitiesStep = ({ liabilities, setLiabilities, children, setChildren }) => {
    const addChild = () => {
        setChildren([...children, { name: '', dob: '', cost: 60000 }]);
    };

    const removeChild = (index) => {
        setChildren(children.filter((_, i) => i !== index));
    };

    const updateChild = (index, field, value) => {
        const newChildren = [...children];
        newChildren[index] = { ...newChildren[index], [field]: value };
        setChildren(newChildren);
    };

    const totalEducationCost = children.reduce((sum, child) => sum + (Number(child.cost) || 0), 0);

    return html`
        <div class="space-y-6 animate-fade-in">
            <h2 class="text-2xl font-bold text-slate-800 mb-6">Liabilities & Education</h2>
            
            <div class="grid md:grid-cols-2 gap-8">
                <div class="space-y-4">
                    <h3 class="font-bold text-slate-700 border-b pb-2">Debts</h3>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Mortgage Balance</label>
                        <div class="relative">
                            <span class="absolute left-3 top-2 text-slate-500">$</span>
                            <input type="number" value=${liabilities.mortgage} onInput=${e => setLiabilities({ ...liabilities, mortgage: Number(e.target.value) })} class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Other Debts (Loans, Cards)</label>
                        <div class="relative">
                            <span class="absolute left-3 top-2 text-slate-500">$</span>
                            <input type="number" value=${liabilities.debts} onInput=${e => setLiabilities({ ...liabilities, debts: Number(e.target.value) })} class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Final Expenses (Funeral)</label>
                        <div class="relative">
                            <span class="absolute left-3 top-2 text-slate-500">$</span>
                            <input type="number" value=${liabilities.finalExpenses} onInput=${e => setLiabilities({ ...liabilities, finalExpenses: Number(e.target.value) })} class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                </div>

                <div class="space-y-4">
                    <div class="flex justify-between items-center border-b pb-2">
                        <h3 class="font-bold text-slate-700">Children & Education</h3>
                        <button onClick=${addChild} class="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200 transition-colors font-medium">+ Add Child</button>
                    </div>
                    
                    <div class="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        ${children.length === 0 && html`<p class="text-sm text-slate-400 italic">No children added.</p>`}
                        ${children.map((child, index) => html`
                            <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 relative group">
                                <button onClick=${() => removeChild(index)} class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors" title="Remove">×</button>
                                <div class="grid grid-cols-2 gap-3 mb-2">
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">Name</label>
                                        <input type="text" value=${child.name} onInput=${e => updateChild(index, 'name', e.target.value)} class="w-full px-2 py-1 text-sm rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Child Name" />
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">DOB</label>
                                        <input type="date" value=${child.dob} onInput=${e => updateChild(index, 'dob', e.target.value)} class="w-full px-2 py-1 text-sm rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-slate-600 mb-1">Est. Education Cost</label>
                                    <div class="relative">
                                        <span class="absolute left-2 top-1 text-slate-500 text-xs">$</span>
                                        <input type="number" value=${child.cost} onInput=${e => updateChild(index, 'cost', Number(e.target.value))} class="w-full pl-5 pr-2 py-1 text-sm rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        `)}
                    </div>

                    <div class="bg-indigo-50 p-4 rounded-lg mt-4">
                        <div class="flex justify-between items-center">
                            <span class="font-medium text-indigo-900">Total Education Cost</span>
                            <span class="font-bold text-indigo-700">${formatCurrency(totalEducationCost)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};
