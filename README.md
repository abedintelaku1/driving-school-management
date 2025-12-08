Let's Go

## Getting Started

1. Run `npm install`
2. Run `npm run dev`


## Branching and Push Policy

Please use the `dev` branch for active development. All developers should create feature branches from `dev` (for example `feature/your-feature`) and push their work to the remote `dev` branch. Open a pull request from your feature branch into `dev` for code review.

Common commands (PowerShell):

```powershell
# create a feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/your-feature

# after changes
git add .
git commit -m "Describe your changes"
git push -u origin feature/your-feature

# create PR into dev on GitHub, or push changes directly to dev if appropriate
```

If you need `dev` to be the repository's default branch or want to add branch protection rules, do that in the GitHub repository settings (Settings → Branches).
