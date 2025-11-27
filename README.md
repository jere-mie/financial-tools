# Financial Tools

A modern, **zero-build** web application for calculating life insurance needs using the DIME method and comprehensive household analysis. Built with Preact and HTM—no npm, no webpack, no transpilation.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## ✨ Features

- 💰 **Quick Life Insurance Needs Estimator** - Single-page DIME method calculator (Debt + Income + Mortgage + Education)
- 📊 **Comprehensive Household Analysis** - Multi-step wizard for detailed household analysis with spouse scenarios
- 🚀 **Zero Build** - No npm, no build step—just refresh and see changes
- 📦 **Fully Vendored** - All dependencies included as static files
- 🎯 **Modern Stack** - Preact + HTM for reactive components
- 🧭 **Client-Side Routing** - Hash-based routing with custom router
- 🎨 **Responsive Design** - Tailwind utilities via vendored Twind runtime
- 💻 **Offline Ready** - Runs entirely in the browser, no server required
- 🤖 **AI-Ready** - Enhanced for AI-assisted development with comprehensive [Copilot instructions](.github/copilot-instructions.md)

## 🚀 Quick Start

Clone and run locally:

```bash
git clone https://github.com/jere-mie/financial-tools.git
cd financial-tools
python3 -m http.server 8000
# then open http://localhost:8000
```

That's all — no build, no setup.

## 🏃 Running the Application

Serve the directory with any static file server:

### Python (comes with most systems)
```bash
python3 -m http.server 8000
```

### Node.js (if you have it)
```bash
npx http-server -p 8000
```

### PHP
```bash
php -S localhost:8000
```

Then open your browser to `http://localhost:8000`

**That's it!** No installation, no build, no wait.

## 📂 Project Structure

```
.
├── index.html                      # Entry point
├── static/
│   ├── components/
│   │   ├── App.js                 # Root component with navigation
│   │   ├── Router.js              # Hash-based routing logic
│   │   ├── Home.js                # Landing page
│   │   ├── LifeInsuranceCalculator.js  # Quick Calc (DIME method)
│   │   ├── ThoroughCalculator.js       # Thorough Calc (multi-step wizard)
│   │   ├── NotFound.js            # 404 page
│   │   └── ThoroughCalcSteps/     # Multi-step wizard components
│   │       ├── IntroStep.js       # Mode selection
│   │       ├── PersonalStep.js    # Spouse info
│   │       ├── LiabilitiesStep.js # Debts & mortgages
│   │       ├── AssetsStep.js      # Savings & insurance
│   │       └── ReportStep.js      # Results display
│   ├── vendor/
│   │   ├── standalone-preact.esm.js  # Preact + Hooks + HTM bundle
│   │   └── twind.cdn.js               # Twind runtime (Tailwind utilities)
│   └── style.css                  # Custom styles
└── LICENSE                         # MIT License
```

## 📖 Using the Application

### Quick Life Insurance Needs Estimator
Calculate life insurance needs in seconds using the industry-standard DIME method:
- **Debt**: Outstanding credit cards, car loans, personal loans
- **Income**: Annual salary × years of replacement needed
- **Mortgage**: Remaining home mortgage balance
- **Education**: Estimated cost for children's education

Results update in real-time as you adjust inputs.

### Comprehensive Household Analysis
A detailed 5-step wizard for thorough analysis:
1. **Intro** - Choose single or joint household analysis
2. **Personal** - Enter spouse information and income details
3. **Liabilities** - Add mortgage, debts, and final expenses
4. **Assets** - List savings and existing insurance coverage
5. **Report** - View detailed gap analysis and recommendations

Supports both single-person and couples' scenarios with separate gap calculations for each spouse.

## 📚 Technical Stack

- **[Preact](https://preactjs.com/)** - Fast 3kB React alternative with hooks
- **[HTM](https://github.com/developit/htm)** - JSX-like syntax using template literals
- **[Twind](https://twind.style/)** - Tailwind-compatible runtime utility CSS
- **[Preact Hooks](https://preactjs.com/guide/v10/hooks/)** - useState, useEffect for component state
- **[Preact Signals](https://preactjs.com/guide/v10/signals/)** - Fine-grained reactivity (optional)

See [Copilot instructions](.github/copilot-instructions.md) for detailed development patterns.

## 🎯 Use Cases

Perfect for:
- 💼 Financial advisors helping clients assess insurance needs
- 🏠 Homeowners planning personal finances
- 💍 Couples evaluating household protection
- 📱 Integration into financial planning websites
- 🔧 Internal business tools (no external dependencies needed)

## 🚢 Deployment

This is a static site with no backend requirements. Deploy anywhere that serves static files:
- **GitHub Pages** - Free, integrates with git
- **Netlify** - Drag-and-drop deployment
- **Vercel** - Optimized for static sites
- **AWS S3 + CloudFront** - Scalable, CDN-backed
- **Traditional Web Hosting** - Any FTP-based host

No build step, no server requirements, no databases—just copy the files and serve.

## 🤝 Contributing

Contributions are welcome! We're looking for:
- Bug reports and fixes
- Feature requests (new calculators, scenarios, etc.)
- UI/UX improvements
- Documentation enhancements
- Accessibility improvements

## 📝 Calculation Methodology

The calculators use industry-standard formulas:

### DIME Method (Quick Estimator)
```
Total Insurance Need = Debt + (Income × Years) + Mortgage + Education
Gap = Total Insurance Need - (Savings + Existing Insurance)
```

### Household Analysis (Comprehensive)
For each spouse scenario:
```
Total Liabilities = Mortgage + Debts + Final Expenses + Education Costs
Insurance Need = (Income × Years) + Total Liabilities
Assets = Savings + Existing Insurance
Gap = max(0, Need - Assets)
```

## 📄 License

This template is licensed under the [MIT License](LICENSE).

### Included Libraries

- **Preact** - MIT License ([preactjs/preact](https://github.com/preactjs/preact))
- **HTM** - Apache License 2.0 ([developit/htm](https://github.com/developit/htm))
- **Twind** - MIT License (Twind runtime vendored in `static/vendor/twind.cdn.js`)

The vendored `standalone-preact.esm.js` bundle includes Preact, Preact Hooks, and HTM. The Twind runtime is vendored separately and applies Tailwind-compatible utility classes at runtime.

## 💡 Philosophy

This template embraces simplicity:
- No build step means no build step failures
- Vendored dependencies mean no version conflicts
- Direct browser execution means instant feedback
- Minimal abstractions mean easier debugging

Modern browsers are powerful. Sometimes, that's all you need.

## 🙋 FAQ

**Q: Are the calculations accurate?**  
A: Yes, the app uses industry-standard insurance calculation methodologies. However, results should be reviewed with a financial advisor for personalized recommendations.

**Q: Is my data stored or tracked?**  
A: No. All calculations happen entirely in your browser. No data is sent to a server—your information never leaves your device.

**Q: Can I embed this in my website?**  
A: Yes. Since there's no build step, you can easily fork and customize it for your domain.

**Q: What browsers are supported?**  
A: Modern browsers with ES module support (Chrome 61+, Firefox 60+, Safari 11+, Edge 79+).

**Q: Can I modify the calculations?**  
A: Absolutely. The calculation logic is in `LifeInsuranceCalculator.js` and `ThoroughCalculator.js`. See [Copilot instructions](.github/copilot-instructions.md) for development patterns.

**Q: Is this production-ready?**  
A: Yes. It's a complete, self-contained web application with no external dependencies or server requirements.

## 🔗 Links

- [Repository](https://github.com/jere-mie/financial-tools)
- [Issues](https://github.com/jere-mie/financial-tools/issues)
- [Development Guide](.github/copilot-instructions.md)

---

**Made with ❤️ by [Jeremie Bornais](https://github.com/jere-mie)**

*Have questions or suggestions? Open an issue!* 💬