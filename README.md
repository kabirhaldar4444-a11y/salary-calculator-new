# Salary Structure Calculator

A responsive Indian salary-structure calculator based on the supplied Google Sheet. It breaks annual CTC into basic salary, HRA, special allowance, PF, gratuity, optional allowances, and an estimated monthly take-home before income tax.

## What is included

- Annual and monthly salary breakdown
- PF on full basic wage or a configurable monthly ceiling
- Employee and employer PF contributions
- Gratuity provision
- Site allowance and other benefits inside CTC
- Project completion bonus shown separately from CTC
- CTC reconciliation and allowance-share checks
- CSV export and print-friendly summary
- Responsive, accessible layout

The model follows the spreadsheet's approach of including both employee and employer PF in the CTC allocation. Unlike the source sheet, the site/project allowance and other benefits inputs reduce the balancing allowance so those inputs affect the result.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Verify and build

```bash
npm test
npm run build
npm run preview
```

The production bundle is written to `dist/`.

## Deploy to Vercel

### Vercel dashboard

1. Push this folder to a GitHub, GitLab, or Bitbucket repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Vercel will detect Vite. Keep the build command as `npm run build` and output directory as `dist`.
4. Select **Deploy**.

### Vercel CLI

```bash
npm install -g vercel
vercel
```

Use `vercel --prod` when you are ready to promote the deployment to production.

## Calculation scope

This tool is an illustrative salary-structure model. It does not calculate income tax, professional tax, insurance, or other payroll deductions, and it does not confirm statutory compliance. Review final payroll treatment with a qualified payroll, tax, or legal professional.
