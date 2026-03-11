# Financial Tools - Agent Instructions

## Project Overview

**Financial Tools** is a collection of privacy-focused, browser-only personal finance tools for residents of **Ontario, Canada**. All calculations run entirely in the user's browser - there is no backend, no data collection, and no external API calls.

The site is deployed as a static website on **GitHub Pages**.

## Tech Stack

- **Framework**: [Astro](https://astro.build/) v6 (static site generation)
- **UI Components**: [React](https://react.dev/) v19 (interactive tools/calculators)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4 (utility-first CSS via `@tailwindcss/vite`)
- **Language**: TypeScript
- **Hosting**: GitHub Pages (via GitHub Actions)

## Code Conventions

- Use **Tailwind CSS utility classes** for all styling. Do not write custom CSS unless absolutely necessary.
- All pages must be **mobile-responsive** (mobile-first design approach).
- Use Astro `.astro` files for pages and layouts. Use React `.tsx` components for interactive tools that require client-side state.
- Place React components in `src/components/` and add `client:load` or `client:visible` directives when embedding in Astro pages.
- All pages should import the shared `Layout.astro` layout for consistent structure, SEO meta tags, and navigation.

## Content Guidelines

- The site targets **residents of Ontario, Canada**. Use Canadian English spelling (e.g., "colour", "licence") in user-facing content where appropriate, but keep tool names in standard English.
- All financial tools and calculators must include a **disclaimer** stating:
  - The tool is for educational/informational purposes only.
  - It does not constitute financial advice.
  - Users should consult a qualified financial professional.
  - Results are estimates and may not reflect individual circumstances.
- Emphasize the **privacy** aspect: all calculations happen in the browser, no data is sent to any server.

## Design Principles

- Use the **frontend-design skill** (`skills/frontend-design/SKILL.md`) for all UI work.
- Maintain a professional, trustworthy aesthetic appropriate for financial tools.
- Ensure clear visual hierarchy and easy-to-read typography.
- All interactive elements must have proper focus states and be keyboard-accessible.

## Build & Deploy

- `npm run dev` - Start local dev server at localhost:4321
- `npm run build` - Build production site to `./dist/`
- `npm run preview` - Preview production build locally
- Deployment is automated via `.github/workflows/deploy.yml` on push to `main`.