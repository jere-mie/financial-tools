import { html } from '../vendor/standalone-preact.esm.js';

export function Home() {
    return html`
        <div class="max-w-5xl mx-auto mt-12 px-4">
            <div class="text-center mb-12">
                <h1 class="text-5xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 via-blue-700 to-blue-900 bg-clip-text text-transparent">
                    Financial Tools
                </h1>
                <p class="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
                    Smart calculators for your financial future.
                </p>
            </div>

            <!-- Tools -->
            <div class="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <!-- Quick Calculator -->
                <div class="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100 text-center flex flex-col h-full">
                    <div class="flex justify-center mb-6">
                        <span class="text-6xl">⚡</span>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-3">Quick Life Insurance Needs Estimator</h2>
                    <p class="text-gray-600 mb-6 flex-grow">
                        Fast estimate using the DIME method. Perfect for a quick check-up.
                    </p>
                    <a 
                        class="inline-flex items-center justify-center px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-all duration-200" 
                        href="#/life-insurance-calc"
                    >
                        Quick Estimate →
                    </a>
                </div>

                <!-- Thorough Calculator -->
                <div class="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100 text-center flex flex-col h-full relative overflow-hidden group">
                    <div class="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
                    <div class="flex justify-center mb-6">
                        <span class="text-6xl">📊</span>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-3">Comprehensive Household Analysis</h2>
                    <p class="text-gray-600 mb-6 flex-grow">
                        Detailed step-by-step analysis for singles or couples. Includes printable PDF report.
                    </p>
                    <a 
                        class="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5" 
                        href="#/thorough-calc"
                    >
                        Start Analysis →
                    </a>
                </div>

                <!-- Mortgage Calculator -->
                <div class="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100 text-center flex flex-col h-full">
                    <div class="flex justify-center mb-6">
                        <span class="text-6xl">🏠</span>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-3">Ontario Mortgage Calculator</h2>
                    <p class="text-gray-600 mb-6 flex-grow">
                        Estimate payments, CMHC insurance, and Land Transfer Tax for Ontario.
                    </p>
                    <a 
                        class="inline-flex items-center justify-center px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-all duration-200" 
                        href="#/mortgage-calc"
                    >
                        Calculate Now →
                    </a>
                </div>

                <!-- Affordability Calculator -->
                <div class="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100 text-center flex flex-col h-full">
                    <div class="flex justify-center mb-6">
                        <span class="text-6xl">📉</span>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-3">Mortgage Affordability</h2>
                    <p class="text-gray-600 mb-6 flex-grow">
                        Calculate your maximum purchase price based on income, debts, and stress test rules.
                    </p>
                    <a 
                        class="inline-flex items-center justify-center px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-all duration-200" 
                        href="#/affordability-calc"
                    >
                        Check Affordability →
                    </a>
                </div>
            </div>
        </div>
    `;
}
