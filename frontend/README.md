# VulnScope — Website Frontend

Automated Web Application Penetration Testing & Vulnerability Reporting Framework

## Stack
- Next.js 15 (App Router)
- TypeScript 5
- Tailwind CSS 4
- Framer Motion 12
- shadcn/ui
- Deployed on Vercel

## Local Development

```bash
npm install
npm run dev   # http://localhost:3000
```

## Build

```bash
npm run build
npm start
```

## Deploy

Connect repo to Vercel. Set environment variables:
- `NEXT_PUBLIC_GITHUB_URL` — Link to your GitHub repository
- `NEXT_PUBLIC_REPORT_URL` — Link to PDF report (or `#` if not available)

## Project Structure

```
vulnscope/
├── app/
│   ├── layout.tsx        # Root layout with Navbar & Footer
│   ├── page.tsx          # Home page with sections
│   └── globals.css       # Global styles
├── components/
│   ├── navbar.tsx        # Fixed navigation with mobile menu
│   ├── hero.tsx          # Hero section with terminal demo
│   ├── terminal-demo.tsx # Animated terminal
│   ├── about.tsx         # Problem statement
│   ├── pipeline.tsx      # Attack pipeline stages
│   ├── tools.tsx         # Filterable tools grid
│   ├── research.tsx      # Research domains
│   ├── owasp.tsx         # OWASP Top 10 coverage
│   └── footer.tsx        # Footer
├── lib/
│   ├── tools-data.ts     # Tool definitions
│   ├── pipeline-data.ts  # Pipeline steps
│   ├── research-data.ts  # Research domains
│   ├── constants.ts      # Environment constants
│   └── utils.ts          # Utility functions
├── public/               # Static assets
├── tailwind.config.ts    # Tailwind configuration
└── tsconfig.json         # TypeScript configuration
```

## Features

- **Responsive Design** — Mobile-first, optimized for all screen sizes
- **Accessible** — WCAG AA compliant with semantic HTML & ARIA labels
- **Animated** — Framer Motion for smooth interactions
- **Dark Theme** — Custom color palette optimized for readability
- **Terminal Animation** — Animated demo showing the command execution
- **Filter Functionality** — Interactive tool filtering by category
- **Smooth Scroll** — Section-based navigation with scroll detection

## License

© 2024–25 Final Year Engineering Project. All rights reserved.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
