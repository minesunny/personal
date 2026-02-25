# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router entrypoints (`layout.tsx`, `page.tsx`) and locale routes under `src/app/[locale]`.
- `src/components`: UI components, including animation primitives in `src/components/animate-ui/primitives`.
- `src/lib`: data-loading and validation utilities (for example `src/lib/resume.ts`).
- `src/data`: localized YAML content (`resume.en.yaml`, `resume.zh.yaml`).
- `src/i18n`: locale config and helpers.
- `src/types`: shared TypeScript types.
- `public`: static assets.
- `.github/workflows/ci.yml`: CI workflow for lint + build checks.

## Build, Test, and Development Commands
- `pnpm install --frozen-lockfile`: install dependencies exactly from `pnpm-lock.yaml` (recommended for clean setup and CI parity).
- `pnpm dev`: start local development server.
- `pnpm lint`: run ESLint checks.
- `pnpm build`: create production build and run type checks.
- `pnpm start`: run production server after build.

Use this pre-PR sanity command:

```bash
pnpm lint && pnpm build
```

## Coding Style & Naming Conventions
- Use TypeScript and React function components.
- Follow existing style: 2-space indentation, semicolons, double quotes.
- Use `PascalCase` for components/types (`ResumeHome`, `ResumeData`).
- Use `camelCase` for functions/hooks/variables (`getResumeData`, `parseLocale`).
- Keep route naming aligned with App Router conventions (dynamic segments like `[locale]`).
- Prefer `@/` alias imports for code under `src`.

## Testing Guidelines
- No dedicated test framework is configured yet.
- The current required quality gate is lint + build (same checks run in CI).
- For every change, run `pnpm lint && pnpm build`.
- If you add tests, place them near source files and use `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines
- Git history is currently minimal (`Initial commit from Create Next App`), so keep commit subjects short and imperative.
- Recommended format: `<scope>: <summary>` (example: `resume: validate social links in yaml`).
- PRs should include all of the following:
1. Clear change summary and motivation.
2. Linked issue/task when applicable.
3. Screenshots/GIFs for UI changes.
4. Confirmation that CI `Code Check & Build` is passing.

Do not merge PRs with failing CI checks.
