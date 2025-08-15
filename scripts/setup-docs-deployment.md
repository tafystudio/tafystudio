# Documentation Deployment Setup Guide

This guide walks through setting up automated documentation deployment to GitHub Pages.

## Prerequisites

- Admin access to both source and target repositories
- GitHub account with ability to create personal access tokens

## Step-by-Step Setup

### 1. Create Personal Access Token

1. Navigate to: <https://github.com/settings/tokens>
2. Click "Generate new token" → "Generate new token (classic)"
3. Configure token:
   - **Note**: `Tafy Studio Docs Deployment`
   - **Expiration**: 90 days or longer
   - **Required Scopes**:
     - ✅ `repo` - Full control of private repositories
     - ✅ `workflow` - Update GitHub Action workflows (if needed)
4. Generate and copy the token immediately

### 2. Add Token to Repository Secrets

1. Go to: <https://github.com/tafystudio/tafystudio/settings/secrets/actions>
2. Click "New repository secret"
3. Create secret:
   - **Name**: `DOCS_DEPLOY_TOKEN`
   - **Secret**: [Paste your token]
4. Click "Add secret"

### 3. Create/Configure Target Repository

#### If `tafystudio.github.io` doesn't exist

1. Create new repository:
   - Name: `tafystudio.github.io`
   - Visibility: Public
   - Initialize with README: Optional

#### Configure GitHub Pages

1. Go to: <https://github.com/tafystudio/tafystudio.github.io/settings/pages>
2. Configure:
   - Source: Deploy from a branch
   - Branch: `gh-pages`
   - Folder: `/ (root)`
3. Save settings

### 4. Test Deployment

Trigger the documentation workflow by:

1. Making any change to documentation files
2. Pushing to `main` branch
3. Or manually trigger: Actions → Documentation → Run workflow

### 5. Verify Deployment

After workflow completes:

1. Check Actions tab for success
2. Visit: <https://tafystudio.github.io/docs/>
3. Documentation should be live at:
   - Main docs: <https://tafystudio.github.io/docs/>
   - Python API: <https://tafystudio.github.io/docs/api/python/>
   - TypeScript API: <https://tafystudio.github.io/docs/api/typescript/>

## Troubleshooting

### Token Permission Issues

If deployment fails with permission errors:

- Ensure token has `repo` scope
- Verify token hasn't expired
- Check you have write access to target repository

### Pages Not Building

If GitHub Pages isn't serving content:

- Check gh-pages branch exists in target repo
- Verify Pages is enabled in repository settings
- Wait 5-10 minutes for initial deployment

### Workflow Failures

Check workflow logs for:

- Missing dependencies
- Build errors in documentation
- Network/API issues

## Current Workflow Configuration

The documentation workflow (`.github/workflows/docs.yml`) is configured to:

1. Run on pushes to `main` branch
2. Build TypeScript and Python API documentation
3. Deploy to `tafystudio/tafystudio.github.io` repository
4. Place docs in `/docs` subdirectory

No changes to the workflow should be needed if following this guide.
