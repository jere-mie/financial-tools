# Copilot Instructions for Life Insurance Calculator

## Project Overview

This is a **no-build, fully vendored** Preact+HTM financial tools SPA with two life insurance calculators:
- **Quick Calc** (`LifeInsuranceCalculator.js`): Single-page DIME method calculator with real-time results
- **Thorough Calc** (`ThoroughCalculator.js`): Multi-step wizard for single/joint household analysis with spouse scenarios

### Key Architecture Principles

1. **Zero-Build**: All code runs directly in browser as ES modules. Never suggest npm, build tools, bundlers, or transpilers.
2. **Fully Vendored**: Preact, HTM, and Twind are static files in `static/vendor/` — do not modify or suggest npm packages.
3. **Hash-Based Routing**: Navigation via `#/path` handled by `Router.js`. Routes defined in `App.js` as `{ path, component }` array.
4. **Real-Time Reactivity**: Both calculators use `useEffect` to auto-calculate when inputs change (no submit button).

## Component Architecture

### Import Pattern
All components import from vendored Preact:
```javascript
import { html, useState, useEffect } from '../vendor/standalone-preact.esm.js';
```

- Use `html` tagged templates (HTM syntax) instead of JSX
- Use `h` for createElement when not using template syntax (see `Router.js`)

### HTM Template Syntax
Components use tagged template literals:
```javascript
return html`
    <div class="container">
        <button onClick=${handleClick}>Click Me</button>
        <${ChildComponent} prop=${value} />
    </div>
`;
```

**Critical**: Component interpolation requires `<${ComponentName} />` syntax, not `<ComponentName />`.

## Routing System

The custom Router (`Router.js`) handles client-side navigation:
- Routes defined as array: `{ path: '/', component: Home }`
- Wildcard route (`path: '*'`) for 404 handling
- Navigation via hash links: `<a href="#/path">`
- Router listens to `hashchange` events
- No query parameters or path parameters currently supported

To add a route:
1. Create component in `static/components/`
2. Import in `App.js`
3. Add to routes array: `{ path: '/newpage', component: NewPage }`
4. Add navigation link with `href="#/newpage"`

## Calculator-Specific Patterns

### Quick Calculator (`LifeInsuranceCalculator.js`)
- Single-page component with real-time calculation
- Uses `useEffect` dependency array to recalculate whenever any input changes
- Implements DIME method: Debt + Income Replacement + Mortgage + Education
- State: income, years, debt, mortgage, education, savings, existingInsurance
- Output: `result` object with `totalNeeds`, `totalAssets`, `gap`, `breakdown`
- Uses `Intl.NumberFormat` for currency formatting (always USD)
- Includes inline Tooltip component for educational help icons

### Thorough Calculator (`ThoroughCalculator.js`)
- Multi-step wizard with 5 steps: Intro → Personal → Liabilities → Assets → Report
- State management:
  - `step` tracks current step (0-4)
  - `mode` determines 'single' or 'joint' scenario
  - `spouse1/spouse2` objects with `{ name, income, years, dob, email, phone }`
  - `liabilities` with `{ mortgage, debts, finalExpenses }`
  - `children` array with `{ name, dob, cost }`
  - `assets` with `{ savings, existingInsurance1, existingInsurance2 }`
  - `results` computed object with gap calculations for each spouse scenario

- Calculation logic:
  - Total liabilities = mortgage + debts + finalExpenses + sum(children costs)
  - For each spouse scenario: `gap = max(0, (income × years) + liabilities - (savings + existingInsurance))`
  - Joint mode calculates separate gaps for both spouses
  - Single mode only calculates spouse1 scenario

- Navigation:
  - `nextStep()`, `prevStep()`, `goToStep(s)` control flow
  - Step components receive props: relevant state data, setters, navigation functions
  - Step definitions at bottom: `{ title, component }` array

## Development Workflow

### Running Locally
Serve with any static file server:
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000`. No build, compile, or watch commands exist.

### File Structure
```
index.html                              # Entry point, renders App into #app
static/
    components/
        App.js                          # Root with navbar & routes
        Router.js                       # Hash-based routing logic
        Home.js                         # Landing page
        LifeInsuranceCalculator.js      # Single-page quick calc
        ThoroughCalculator.js           # Multi-step wizard
        NotFound.js                     # 404 page
        ThoroughCalcSteps/
            IntroStep.js                # Mode selection (single/joint)
            PersonalStep.js             # Spouse info input
            LiabilitiesStep.js          # Debt & mortgage input
            AssetsStep.js               # Savings & existing insurance input
            ReportStep.js               # Results display
    vendor/
        standalone-preact.esm.js        # Preact + Hooks + HTM bundle
        twind.cdn.js                    # Twind runtime (Tailwind utilities)
    style.css                           # Custom styles
```

## Styling & Theming

- Twind runtime (vendored in `static/vendor/twind.cdn.js`) provides Tailwind utilities at runtime
- Use Tailwind classes directly (e.g., `px-4`, `text-center`, `bg-blue-600`)
- Color scheme uses indigo/purple/pink gradients (`from-indigo-600 via-purple-600 to-pink-600`)
- Custom CSS in `static/style.css` for any overrides or utilities
- Class names use `class=`, not `className` (HTM, not JSX)

## State Management

- Use Preact hooks (`useState`, `useEffect`) for component state
- No global state library
- For shared state, lift state up to parent and pass via props
- Optional: Preact Signals API available in vendor bundle for fine-grained reactivity:
  ```javascript
  import { signal, useSignal } from '../vendor/standalone-preact.esm.js';
  ```

## Common Patterns

### Event Handlers
```javascript
<button onClick=${handleClick}>Click</button>
```
Pass function references directly, no arrow functions needed in templates.

### Conditional Rendering
```javascript
${condition ? html`<div>Shown</div>` : null}
${menuOpen ? 'block' : 'hidden'}  // For class visibility
```

### Number Formatting
```javascript
const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD', 
        maximumFractionDigits: 0 
    }).format(val);
};
```

### useEffect with Dependencies
Always clean up timers/listeners and specify dependency array:
```javascript
useEffect(() => {
    const timer = setInterval(() => { /* ... */ }, 1000);
    return () => clearInterval(timer);
}, [dependency]);
```

## Adding Features

### New Step in Thorough Calculator
1. Create new component in `ThoroughCalcSteps/` as named export
2. Receive props: relevant state data, setters, `nextStep`, `prevStep`
3. Return `html` template
4. Add to steps array in `ThoroughCalculator.js`: `{ title: 'Name', component: NewStep }`
5. Pass required props when rendering step component

### New Route/Page
1. Create component in `static/components/`
2. Import in `App.js`
3. Add to routes array in `App.js`
4. Add navigation link in navbar or elsewhere with `href="#/path"`

### New Vendored Library
1. Download standalone ES module build to `static/vendor/`
2. Import in components: `import { foo } from '../vendor/library.esm.js';`
3. Use the `esm.sh` or `jspm.org` services to find ES module versions

## Browser Compatibility

- Targets modern browsers with ES module support (Chrome 61+, Firefox 60+, Safari 11+, Edge 79+)
- No polyfills or transpilation included
- If older browser support is needed, this template is not appropriate

## Critical Constraints

**Never suggest:**
- Adding package.json or npm/yarn commands
- Build tools (webpack, vite, rollup, parcel, etc.)
- Transpilers (Babel, TypeScript compiler, etc.)
- CSS preprocessors (Sass, Less, PostCSC)
- Module bundlers or tree-shaking
- Hot module replacement or watch modes
- Any tool requiring a "build" or "compile" step

If user requests these, explain that the project's philosophy is zero-build simplicity and suggest using a different template if those features are needed.
