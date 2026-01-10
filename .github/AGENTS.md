
# Copilot Instructions — Frontend UI Designer

Your task is to onboard this repository as a frontend UI designer and implement visually correct, modern, production-quality UI changes with minimal exploration.

Trust these instructions and only search the repository if information here is missing or incorrect.

---

## <Goals>
- Prevent UI regressions, broken layouts, and inconsistent styling.
- Avoid pull requests that “work” but visually diverge from the product design language.
- Reduce time spent exploring files by clearly documenting UI structure and conventions.
- Ensure responsive, accessible, and visually polished UI output.
</Goals>

---

## <Limitations>
- Instructions are non-task-specific.
- Instructions focus on UI, layout, styling, and UX correctness.
</Limitations>

---

## <WhatToAdd>

### <HighLevelDetails>

#### Repository Summary
This repository contains **iMock**, a modern AI SaaS frontend focused on mock interviews and job preparation.  
The UI emphasizes clarity, trust, friendliness, and confidence using soft gradients, rounded components, and clean typography.

#### High-Level Project Info
- **Project type:** Frontend UI / SaaS landing & app interface
- **Framework:** React (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Component system:** shadcn/ui (Radix UI primitives)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Target:** Desktop-first, fully responsive

</HighLevelDetails>

---

### <BuildInstructions>

#### Environment Setup (UI Validation)
- **Node.js:** v18+ required
- **Install dependencies (always first):**
```bash
npm install
````

#### Run UI Locally

```bash
npm run dev
```

* Use this to visually validate all UI changes.
* Always check desktop and mobile breakpoints.

#### UI Build Validation

```bash
npm run build
```

* Must pass before submitting UI changes.
* Fails if Tailwind, TypeScript, or imports are incorrect.

#### Linting (UI Safety)

```bash
npm run lint
```

* Must pass before PR submission.
* Prevents unused components, imports, and styling issues.

#### Validation Order (Always Follow)

1. `npm install`
2. `npm run dev` (visual inspection)
3. `npm run lint`
4. `npm run build`

Never submit UI changes without visually validating them locally.

</BuildInstructions>

---

### <ProjectLayout>

#### UI Architecture

* **src/components/**

  * Reusable UI blocks (buttons, cards, nav, forms)
  * shadcn/ui components live in `components/ui`
* **src/pages/** or **src/routes/**

  * Page-level layouts (Landing, Auth, Dashboard)
* **src/layouts/**

  * Shared layout wrappers
* **src/lib/**

  * Utility functions (`cn`, constants)
* **src/assets/**

  * Images, illustrations, icons

#### Styling Rules (Critical)

* Tailwind CSS only (no inline styles).
* Prefer utility classes over custom CSS.
* Use consistent spacing, font sizes, and color tokens.
* Rounded corners: `rounded-xl` or `rounded-2xl`
* Shadows: soft and subtle (`shadow-lg`, low opacity)
* Gradients: light, AI-style, never harsh or high contrast.

#### Typography

* **Headings:** Plus Jakarta Sans (semibold / bold)
* **Body & UI:** Inter (regular / medium)
* Avoid mixing fonts unnecessarily.
* Maintain clear visual hierarchy.

#### Component Rules

* Prefer existing components before creating new ones.
* Extend shadcn/ui components instead of replacing them.
* Maintain consistent button sizes, padding, and hover states.
* All interactive elements must have hover and focus states.

#### Animations

* Use Framer Motion sparingly.
* Favor subtle fade, slide, or floating animations.
* Avoid distracting or excessive motion.

#### Responsiveness

* Mobile-friendly layouts are required.
* Use Tailwind breakpoints consistently.
* Avoid fixed widths unless intentional.

#### Validation & CI

* CI (if present) validates lint and build.
* UI correctness is evaluated visually by the user.
* PRs with visual inconsistency are likely to be rejected.

#### Repository Root Files (UI-Relevant)

* `tailwind.config.ts`
* `package.json`
* `vite.config.ts`
* `src/components/`
* `src/pages/`
* `README.md`

</ProjectLayout>

---

## <StepsToFollow>

* Treat this project as a premium AI SaaS product.
* Prioritize visual quality and consistency over speed.
* Reuse existing patterns and styles.
* Do not introduce new design systems or libraries.
* Validate UI locally before submitting changes.
* Trust these instructions; search only if necessary.

</StepsToFollow>
```