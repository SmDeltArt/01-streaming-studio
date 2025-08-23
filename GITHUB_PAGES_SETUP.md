# GitHub Pages Deployment Guide

## Overview
This repository is now configured with automated GitHub Pages deployment using GitHub Actions. The deployment workflow will automatically build and deploy your site whenever you push to the `main` branch.

## Setup Instructions

### 1. Enable GitHub Pages in Repository Settings
1. Go to your repository on GitHub: `https://github.com/SmDeltArt/01-streaming-studio`
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select "GitHub Actions"
5. Save the changes

### 2. Workflow Configuration
The deployment workflow is configured in `.github/workflows/deploy.yml` and includes:

- **Triggers**: Runs on push to `main` branch and manual dispatch
- **Build Process**: Installs dependencies and runs tests
- **Deployment**: Automatically deploys to GitHub Pages
- **Permissions**: Proper GitHub Pages permissions are set

### 3. Deployment Process
The workflow performs these steps:
1. Checks out the code
2. Sets up Node.js 20
3. Installs npm dependencies (`npm ci`)
4. Runs tests (`npm test`)
5. Configures GitHub Pages
6. Uploads the site as an artifact
7. Deploys to GitHub Pages

### 4. Manual Deployment
You can also trigger deployment manually:
1. Go to **Actions** tab in your repository
2. Select the "Deploy to GitHub Pages" workflow
3. Click "Run workflow"
4. Choose the branch (main) and click "Run workflow"

### 5. Accessing Your Site
Once deployed, your site will be available at:
```
https://smdelart.github.io/01-streaming-studio/
```

### 6. Branch Strategy
- **main branch**: Automatically deploys to GitHub Pages
- **stable branch**: Uses the `pages-stable.yml` workflow (existing)

## Troubleshooting

### Test Failures
Currently, there's one failing test in `tests/control-panel.test.js` looking for a missing button (`iframeRecordBtn`). This doesn't prevent deployment but should be fixed:
- Either add the missing button to `index.html`
- Or update/remove the test if the button is no longer needed

### Workflow Failures
If the deployment fails:
1. Check the **Actions** tab for error details
2. Ensure all dependencies are properly defined in `package.json`
3. Verify that the tests pass locally with `npm test`

### Pages Not Loading
If the site doesn't load correctly:
1. Check that all relative paths in HTML/CSS/JS are correct
2. Ensure no absolute localhost URLs are used
3. Verify that all assets are committed to the repository

## Next Steps
1. Push your changes to GitHub: `git push origin main`
2. Enable GitHub Pages in repository settings
3. Monitor the first deployment in the Actions tab
4. Access your live site once deployment completes

The deployment workflow is now ready and will automatically handle future deployments when you push to the main branch.
