# Contributing

This document defines how we work together as a team during the hackathon. Keep it simple — the goal is to move fast without stepping on each other.

---

## Branch Strategy

We use a simple trunk-based approach:

```
main              ← always demo-ready, protected
├── feat/cv-pipeline
├── feat/ml-model
├── feat/api-endpoints
└── feat/frontend-dashboard
```

**Rules:**
- `main` must always run. Never push broken code to `main`.
- Each team member works on their own `feat/` branch.
- Merge into `main` via PR. At least one other person reviews before merging.
- If you're blocked waiting for a review, ping in Slack — don't merge your own PR.

---

## Commit Messages

Format: `type(scope): short description`

```
feat(cv): add ROI filtering for platform area
fix(api): return 404 for unknown station IDs
docs(ml): document feature engineering steps
refactor(frontend): extract CongestionBar component
chore: update requirements.txt
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`  
Scopes: `cv`, `ml`, `api`, `frontend`, `data`, `docs`

**Keep commits small and focused.** One logical change per commit. This makes debugging much easier during the hackathon.

---

## Pull Requests

PR title follows the same format as commits.

PR description template:
```markdown
## What
Brief description of what this PR does.

## Why
Why is this change needed?

## Test
How to verify this works (command to run, or what to look for in the UI).

## Screenshots (if frontend)
Before / after screenshots if visual changes.
```

**PR size:** Aim for <200 lines changed. Large PRs are hard to review quickly. Split them if needed.

---

## Code Standards

### Python (CV, ML, API)

- Python 3.11+
- Formatter: **black** (`black .` before committing)
- Linter: **ruff** (`ruff check .`)
- Type hints on all function signatures
- Docstrings on public classes and non-obvious functions

```python
# Good
def estimate_density(count: int, area_m2: float, max_density: float = 2.5) -> float:
    """
    Convert raw person count to a normalised density score [0, 1].
    
    Args:
        count: Number of detected persons on the platform.
        area_m2: Platform area in square metres.
        max_density: Maximum persons/m² before score clamps to 1.0.
    
    Returns:
        Density score between 0.0 (empty) and 1.0 (at capacity).
    """
    return min(1.0, (count / area_m2) / max_density)

# Bad
def est(c, a):
    return min(1.0, c/a/2.5)
```

**Pre-commit hooks:**
```bash
pip install pre-commit
pre-commit install
```
This runs black and ruff automatically on every commit.

### JavaScript / React (Frontend)

- ES2022+, no TypeScript required for hackathon
- Formatter: **prettier** (`npx prettier --write src/`)
- Components in `PascalCase`, files in `PascalCase.jsx`
- Hooks in `camelCase`, files in `use-name.js`
- No inline styles longer than 3 properties — move to a `styles` object

```jsx
// Good
const cardStyle = {
  background: "#081525",
  border: "1px solid #1A2D42",
  borderRadius: 10,
  padding: "16px",
};

function StationCard({ station, congestion }) {
  return <div style={cardStyle}>...</div>;
}

// Avoid: sprawling inline styles on JSX elements
```

### General

- No hardcoded secrets. Use `.env` files. `.env` is in `.gitignore`.
- No `print()` debugging left in code. Use `logging` in Python, `console.log` in JS (removed before merge).
- Delete dead code. Don't comment it out.

---

## File Structure Rules

- Each module (`cv/`, `ml/`, `api/`, `frontend/`) owns its own `requirements.txt` or `package.json`.
- Data files go in `data/`. Don't scatter CSVs or JSONs in module directories.
- Tests go in a `tests/` folder inside each module.
- Don't commit model weights to git (they're large). Add to `.gitignore`. Download script in `ml/download_weights.sh`.

---

## Environment Setup

```bash
# Clone
git clone https://github.com/your-team/bakimove
cd bakimove

# Copy env template
cp .env.example .env

# Backend
cd api && pip install -r requirements.txt

# CV
cd ../cv && pip install -r requirements.txt

# ML
cd ../ml && pip install -r requirements.txt && python train.py

# Frontend
cd ../frontend && npm install
```

---

## Communication During the Hackathon

- **Slack / Telegram:** Primary async channel for updates, questions, blockers
- **Standup (verbal):** Every 3–4 hours. Answer: what did you finish, what are you doing next, are you blocked?
- **Decisions:** Make them in Slack so there's a record. Don't make architecture decisions verbally without writing them down.
- **Blockers:** Say something immediately. Don't spend >30 minutes stuck without asking for help.

---

## Demo Checklist

Before the final presentation, verify:

- [ ] `docker-compose up` starts all services without errors
- [ ] Frontend loads at localhost:3000
- [ ] Live Feed tab shows moving detections
- [ ] Route Planner returns a recommendation for at least 3 station pairs
- [ ] Station Intel lists all 25 stations
- [ ] Hour scrubber updates all charts in real time
- [ ] API docs load at localhost:8000/docs
- [ ] No console errors in the browser
- [ ] README has accurate setup instructions

---

## .gitignore Key Entries

```
.env
*.pkl         # trained model files (too large)
*.pt          # YOLO weights
__pycache__/
.venv/
node_modules/
dist/
*.pyc
.DS_Store
data/synthetic/ridership.csv   # regenerated, don't commit
```
