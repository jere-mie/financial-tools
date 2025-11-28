import { html } from '../../vendor/standalone-preact.esm.js';

export const PersonalStep = ({ mode, spouse1, setSpouse1, spouse2, setSpouse2 }) => html`
    <div class="space-y-6 animate-fade-in">
        <h2 class="text-2xl font-bold text-slate-800 mb-6">Personal Details</h2>
        
        <div class="grid md:grid-cols-${mode === 'joint' ? '2' : '1'} gap-8">
            <!-- Spouse 1 -->
            <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 class="font-bold text-indigo-900 mb-4 flex items-center">
                    <span class="bg-indigo-100 text-indigo-600 rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm">1</span>
                    Your Details
                </h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input type="text" value=${spouse1.name} onInput=${e => setSpouse1({ ...spouse1, name: e.target.value })} class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                        <input type="date" value=${spouse1.dob} onInput=${e => setSpouse1({ ...spouse1, dob: e.target.value })} class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div class="flex items-center pt-4">
                        <input 
                            type="checkbox" 
                            id="spouse1-smoker"
                            checked=${spouse1.smoker} 
                            onChange=${e => setSpouse1({ ...spouse1, smoker: e.target.checked })} 
                            class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                        />
                        <label for="spouse1-smoker" class="ml-2 block text-sm font-medium text-slate-700">Smoker</label>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input type="email" value=${spouse1.email} onInput=${e => setSpouse1({ ...spouse1, email: e.target.value })} class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="email@example.com" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                        <input type="tel" value=${spouse1.phone} onInput=${e => setSpouse1({ ...spouse1, phone: e.target.value })} class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="(555) 123-4567" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Annual Income</label>
                        <div class="relative">
                            <span class="absolute left-3 top-2 text-slate-500">$</span>
                            <input type="number" value=${spouse1.income} onInput=${e => setSpouse1({ ...spouse1, income: Number(e.target.value) })} class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Years to Replace</label>
                        <input type="number" value=${spouse1.years} onInput=${e => setSpouse1({ ...spouse1, years: Number(e.target.value) })} class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        <p class="text-xs text-slate-500 mt-1">Recommended: 7-12 years</p>
                    </div>
                </div>
            </div>

            <!-- Spouse 2 -->
            ${mode === 'joint' && html`
            <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 class="font-bold text-indigo-900 mb-4 flex items-center">
                    <span class="bg-indigo-100 text-indigo-600 rounded-full w-8 h-8 flex items-center justify-center mr-2 text-sm">2</span>
                    Partner Details
                </h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input type="text" value=${spouse2.name} onInput=${e => setSpouse2({ ...spouse2, name: e.target.value })} class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                        <input type="date" value=${spouse2.dob} onInput=${e => setSpouse2({ ...spouse2, dob: e.target.value })} class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div class="flex items-center pt-4">
                        <input 
                            type="checkbox" 
                            id="spouse2-smoker"
                            checked=${spouse2.smoker} 
                            onChange=${e => setSpouse2({ ...spouse2, smoker: e.target.checked })} 
                            class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                        />
                        <label for="spouse2-smoker" class="ml-2 block text-sm font-medium text-slate-700">Smoker</label>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input type="email" value=${spouse2.email} onInput=${e => setSpouse2({ ...spouse2, email: e.target.value })} class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="email@example.com" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                        <input type="tel" value=${spouse2.phone} onInput=${e => setSpouse2({ ...spouse2, phone: e.target.value })} class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="(555) 123-4567" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Annual Income</label>
                        <div class="relative">
                            <span class="absolute left-3 top-2 text-slate-500">$</span>
                            <input type="number" value=${spouse2.income} onInput=${e => setSpouse2({ ...spouse2, income: Number(e.target.value) })} class="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Years to Replace</label>
                        <input type="number" value=${spouse2.years} onInput=${e => setSpouse2({ ...spouse2, years: Number(e.target.value) })} class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        <p class="text-xs text-slate-500 mt-1">Recommended: 7-12 years</p>
                    </div>
                </div>
            </div>
            `}
        </div>
    </div>
`;
