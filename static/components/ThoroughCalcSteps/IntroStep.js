import { html } from '../../vendor/standalone-preact.esm.js';

export const IntroStep = ({ mode, setMode, nextStep }) => html`
    <div class="space-y-6 text-center animate-fade-in">
        <div class="text-6xl mb-4">👨‍👩‍👧‍👦</div>
        <h2 class="text-2xl font-bold text-slate-800">Comprehensive Household Insurance Analysis</h2>
        <p class="text-slate-600 max-w-lg mx-auto">
            Get a detailed analysis of your household's life insurance needs. Answer a few questions about your finances and family, and we'll calculate how much protection you need. 
        </p>
        
        <div class="grid grid-cols-2 gap-4 max-w-md mx-auto mt-8">
            <button 
                onClick=${() => { setMode('single'); nextStep(); }}
                class="p-6 rounded-xl border-2 transition-all ${mode === 'single' ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'}"
            >
                <div class="text-3xl mb-2">👤</div>
                <div class="font-bold text-slate-700">Just Me</div>
            </button>
            <button 
                onClick=${() => { setMode('joint'); nextStep(); }}
                class="p-6 rounded-xl border-2 transition-all ${mode === 'joint' ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'}"
            >
                <div class="text-3xl mb-2">👥</div>
                <div class="font-bold text-slate-700">Me & Partner</div>
            </button>
        </div>
    </div>
`;
