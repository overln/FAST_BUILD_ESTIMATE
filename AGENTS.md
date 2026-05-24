# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the React + TypeScript app. Keep page-level UI in `src/pages/`, shared calculation and persistence helpers in `src/utils/`, and default estimator settings in `src/config/`. Entry points are `src/main.tsx` and `src/App.tsx`, with shared styling in `src/styles.css`. Build output goes to `dist/` and should not be edited manually.

`calibration/` is a separate Python utility for tuning pricing assumptions from historical project data. Sample inputs live in `calibration/input/`; generated reports should be written to `calibration/output/`.

## Build, Test, and Development Commands
Run the app locally with `npm run dev`. Create a production build with `npm run build`; this also runs TypeScript project compilation via `tsc -b`. Preview the built app with `npm run preview`.

For the calibration workflow, create a virtual environment with `uv venv`, activate it, then install dependencies from `calibration/pyproject.toml`. Run the tool with:

```bash
python calibration/calibrate.py \
  --projects calibration/input/projects.sample.csv \
  --config calibration/input/current_config.sample.json \
  --output calibration/output
```

## Coding Style & Naming Conventions
Follow the existing code style: TypeScript with 2-space indentation, semicolons, and single quotes. Use `PascalCase` for React components, `camelCase` for helpers, and keep domain enums and persisted input keys in the existing snake_case form such as `floor_area_m2` and `finish_level`. Prefer small, typed utility functions over inline calculation logic in components.

## Testing Guidelines
There is no formal test suite yet. Until one is added, treat `npm run build` as the minimum validation step for frontend changes. For pricing logic changes, verify both the estimator UI and the calibration script against the sample files in `calibration/input/`. If you add tests later, place frontend tests beside the affected module or under `src/__tests__/`.

## Commit & Pull Request Guidelines
Keep commit messages short and imperative, matching the current history, for example `update README.md`. Group related UI, config, and calculation changes in the same commit only when they ship together.

Pull requests should explain the user-facing impact, list validation steps, and note any config or formula changes. Include screenshots for UI updates and sample output snippets for calibration changes.
