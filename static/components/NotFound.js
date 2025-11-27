import { html } from '../vendor/standalone-preact.esm.js';

export function NotFound() {
    return html`
        <div class="max-w-3xl mx-auto mt-12 px-4">
            <div class="bg-white rounded-2xl shadow-2xl p-10 text-center border border-gray-100">
                <div class="mb-6">
                    <span class="text-8xl">😕</span>
                </div>
                <h1 class="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-400 mb-4">404</h1>
                <h2 class="text-3xl font-bold mt-2 mb-4 text-gray-800">Page Not Found</h2>
                <p class="text-xl text-gray-600 mb-8 max-w-md mx-auto">
                    Oops! The page you're looking for seems to have wandered off into the digital void.
                </p>
                <a 
                    href="#/" 
                    class="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    ← Go Back Home
                </a>
            </div>
        </div>
    `;
}
