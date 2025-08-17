# Documentation Deployment Setup Guide

This guide walks through setting up automated documentation deployment using Docusaurus in a separate repository.

## Architecture Overview

- **Main Repository** (`tafystudio/tafystudio`): Contains all documentation source files in the `docs/` directory
- **Documentation Repository** (`tafystudio/tafystudio-docs`): Contains Docusaurus configuration and GitHub Actions to build/deploy
- **Documentation Site**: Deployed to `docs.tafy.studio` via GitHub Pages

## Prerequisites

- Admin access to create repositories and secrets
- GitHub account with ability to create personal access tokens
- Access to DNS settings for the `tafy.studio` domain

## Step 1: Create Personal Access Token

The documentation repository needs to access the main repository to fetch documentation.

1. Navigate to: <https://github.com/settings/tokens>
2. Click "Generate new token" → "Generate new token (classic)"
3. Configure token:
   - **Note**: `Tafy Studio Docs Builder`
   - **Expiration**: 90 days or longer
   - **Required Scopes**:
     - ✅ `repo` - Full control of private repositories (if main repo is private)
     - ✅ `public_repo` - Access public repositories (if main repo is public)
4. Generate and copy the token immediately

## Step 2: Create Documentation Repository

1. Create new repository at GitHub:
   - Name: `tafystudio-docs`
   - Full path: `tafystudio/tafystudio-docs`
   - Visibility: Public
   - Initialize with README: No (we'll set it up properly)
   - Add `.gitignore`: Node
   - License: Same as main project (Apache 2.0)

2. Clone the repository locally:

   ```bash
   git clone https://github.com/tafystudio/tafystudio-docs.git
   cd tafystudio-docs
   ```

## Step 3: Initialize Docusaurus

Create the following files in the `tafystudio-docs` repository:

### `package.json`

```json
{
  "name": "tafystudio-docs",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "docusaurus": "docusaurus",
    "start": "docusaurus start",
    "build": "docusaurus build",
    "swizzle": "docusaurus swizzle",
    "deploy": "docusaurus deploy",
    "clear": "docusaurus clear",
    "serve": "docusaurus serve",
    "write-translations": "docusaurus write-translations",
    "write-heading-ids": "docusaurus write-heading-ids"
  },
  "dependencies": {
    "@docusaurus/core": "^3.6.3",
    "@docusaurus/preset-classic": "^3.6.3",
    "@mdx-js/react": "^3.0.0",
    "clsx": "^2.0.0",
    "prism-react-renderer": "^2.3.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@docusaurus/module-type-aliases": "^3.6.3",
    "@docusaurus/types": "^3.6.3"
  },
  "browserslist": {
    "production": [
      ">0.5%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 3 chrome version",
      "last 3 firefox version",
      "last 5 safari version"
    ]
  },
  "engines": {
    "node": ">=18.0"
  }
}
```

### `docusaurus.config.js`

```javascript
// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Tafy Studio Documentation',
  tagline: 'Robot Distributed Operation System',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.tafy.studio',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/',

  // GitHub pages deployment config.
  organizationName: 'tafystudio',
  projectName: 'tafystudio-docs',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/', // Serve docs at the root
          // Remove this to remove the "Edit this page" links.
          editUrl:
            'https://github.com/tafystudio/tafystudio/tree/main/docs/',
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'Tafy Studio',
        logo: {
          alt: 'Tafy Studio Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            href: 'https://github.com/tafystudio/tafystudio',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: 'https://tafy.studio',
            label: 'Main Site',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting Started',
                to: '/',
              },
              {
                label: 'Architecture',
                to: '/ARCHITECTURE',
              },
              {
                label: 'API Reference',
                to: '/api',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/tafystudio/tafystudio',
              },
              {
                label: 'Discussions',
                href: 'https://github.com/tafystudio/tafystudio/discussions',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Main Website',
                href: 'https://tafy.studio',
              },
              {
                label: 'Security',
                href: 'https://github.com/tafystudio/tafystudio/security',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Tafy Studio. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'diff', 'json', 'docker', 'yaml', 'python', 'go'],
      },
    }),
};

export default config;
```

### `sidebars.js`

```javascript
/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    'README',
    {
      type: 'category',
      label: 'Overview',
      items: [
        'VISION',
        'ARCHITECTURE',
        'CONCEPTS',
      ],
    },
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'QUICKSTART',
        'DEVELOPMENT_SETUP',
        'TROUBLESHOOTING',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      items: [
        'TESTING',
        'SECURITY',
        'HAL_SPEC',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/index',
        'api/typescript',
        'api/python',
        'api/go',
      ],
    },
  ],
};

export default sidebars;
```

### `.github/workflows/deploy.yml`

```yaml
name: Deploy Documentation

on:
  push:
    branches: [main]
  workflow_dispatch:
  repository_dispatch:
    types: [docs-update]
  schedule:
    # Run every 6 hours to catch updates from main repo
    - cron: '0 */6 * * *'

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout docs repository
        uses: actions/checkout@v4
        
      - name: Checkout main repository
        uses: actions/checkout@v4
        with:
          repository: tafystudio/tafystudio
          path: tafystudio-main
          token: ${{ secrets.DOCS_ACCESS_TOKEN }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      
      - name: Install dependencies
        run: |
          npm ci
          pip install sphinx sphinx-rtd-theme sphinx-autodoc-typehints
      
      - name: Copy documentation from main repo
        run: |
          # Create docs directory
          mkdir -p docs
          
          # Copy all markdown files from main repo's docs directory
          cp -r tafystudio-main/docs/* docs/
          cp tafystudio-main/README.md docs/
          
          # Create API documentation directory
          mkdir -p docs/api
          
          # Create API index
          cat > docs/api/index.md << 'EOF'
          ---
          title: API Reference
          description: Tafy Studio API documentation
          ---

          # API Reference

          Tafy Studio provides APIs in multiple languages for building robotics applications.

          ## Available APIs

          ### [TypeScript/JavaScript API](./typescript)
          The TypeScript SDK for building web interfaces and Node.js applications.

          ### [Python API](./python)
          The Python SDK for building backend services and robotics applications.

          ### [Go API](./go)
          The Go SDK for building high-performance node agents and services.

          ## Getting Started

          Each API provides:
          - Client libraries for NATS messaging
          - HAL (Hardware Abstraction Layer) message types
          - Helper utilities for common robotics tasks

          Choose the API that best fits your use case and development environment.
          EOF
          
          # Generate TypeScript API docs placeholder
          cat > docs/api/typescript.md << 'EOF'
          ---
          title: TypeScript API
          ---

          # TypeScript API Reference

          The TypeScript SDK is available as `@tafystudio/sdk-ts`.

          ## Installation

          ```bash
          npm install @tafystudio/sdk-ts
          ```

          ## Usage

          ```typescript
          import { TafyClient } from '@tafystudio/sdk-ts';

          const client = new TafyClient({
            natsUrl: 'nats://localhost:4222'
          });

          await client.connect();
          ```

          Full API documentation will be generated from the TypeScript source.
          EOF
          
          # Generate Python API docs
          if [ -d "tafystudio-main/apps/hub-api" ]; then
            cd tafystudio-main/apps/hub-api
            python -m venv .venv
            source .venv/bin/activate
            pip install -e . || echo "No setup.py found, skipping install"
            
            # Try to generate Sphinx docs
            if [ -d "docs" ]; then
              cd docs
              sphinx-build -b markdown . ../../../../docs/api/python -W --keep-going || {
                echo "Sphinx build had warnings, continuing..."
              }
              cd ..
            fi
            
            deactivate
            cd ../../..
          fi
          
          # Go API docs reference
          cat > docs/api/go.md << 'EOF'
          ---
          title: Go API
          ---

          # Go API Reference

          The Go SDK is available as a Go module.

          ## Installation

          ```bash
          go get github.com/tafystudio/tafystudio/packages/sdk-go
          ```

          ## Documentation

          Full API documentation is available at:
          <https://pkg.go.dev/github.com/tafystudio/tafystudio>

          ## Usage

          ```go
          import (
              "github.com/tafystudio/tafystudio/packages/sdk-go/client"
          )

          client, err := client.NewTafyClient("nats://localhost:4222")
          if err != nil {
              log.Fatal(err)
          }
          defer client.Close()
          ```
          EOF
      
      - name: Build documentation
        run: npm run build
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./build

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### `README.md`

```markdown
# Tafy Studio Documentation Site

This repository contains the Docusaurus configuration for the Tafy Studio documentation website deployed at <https://docs.tafy.studio>.

## Architecture

- Documentation source files are maintained in the main [tafystudio/tafystudio](https://github.com/tafystudio/tafystudio) repository
- This repository contains only the Docusaurus configuration and build process
- GitHub Actions automatically fetches the latest docs and builds the site
- Deployment happens via GitHub Pages

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build production site
npm run build

# Serve production build locally
npm run serve
```

## Deployment

The site automatically deploys when:

- Changes are pushed to the `main` branch
- Every 6 hours (to catch updates from the main repository)
- Manually triggered via GitHub Actions

## Configuration

- `docusaurus.config.js` - Main configuration
- `sidebars.js` - Documentation sidebar structure
- `.github/workflows/deploy.yml` - Automated build and deployment

## Contributing

Documentation content should be contributed to the main repository at [tafystudio/tafystudio](https://github.com/tafystudio/tafystudio).

### `static/CNAME`

```text
docs.tafy.studio
```

### `src/css/custom.css`

```css
/**
 * Any CSS included here will be global. The classic template
 * bundles Infima by default. Infima is a CSS framework designed to
 * work well for content-centric websites.
 */

/* You can override the default Infima variables here. */
:root {
  --ifm-color-primary: #2e8555;
  --ifm-color-primary-dark: #29784c;
  --ifm-color-primary-darker: #277148;
  --ifm-color-primary-darkest: #205d3b;
  --ifm-color-primary-light: #33925d;
  --ifm-color-primary-lighter: #359962;
  --ifm-color-primary-lightest: #3cad6e;
  --ifm-code-font-size: 95%;
  --docusaurus-highlighted-code-line-bg: rgba(0, 0, 0, 0.1);
}

/* For readability concerns, you should choose a lighter palette in dark mode. */
[data-theme='dark'] {
  --ifm-color-primary: #25c2a0;
  --ifm-color-primary-dark: #21af90;
  --ifm-color-primary-darker: #1fa588;
  --ifm-color-primary-darkest: #1a8870;
  --ifm-color-primary-light: #29d5b0;
  --ifm-color-primary-lighter: #32d8b4;
  --ifm-color-primary-lightest: #4fddbf;
  --docusaurus-highlighted-code-line-bg: rgba(0, 0, 0, 0.3);
}
```

### Directory structure to create

```bash
mkdir -p src/css static docs
```

## Step 4: Configure Repository Secrets

### In the documentation repository (`tafystudio-docs`)

1. Go to: <https://github.com/tafystudio/tafystudio-docs/settings/secrets/actions>
2. Add new secret:
   - **Name**: `DOCS_ACCESS_TOKEN`
   - **Value**: The personal access token from Step 1

### In the main repository (`tafystudio`)

1. Go to: <https://github.com/tafystudio/tafystudio/settings/secrets/actions>
2. Add new secret:
   - **Name**: `DOCS_TRIGGER_TOKEN`
   - **Value**: The same personal access token from Step 1
   - **Note**: This allows the main repo to trigger builds in the docs repo

## Step 5: Configure GitHub Pages

1. Go to: <https://github.com/tafystudio/tafystudio-docs/settings/pages>
2. Configure:
   - **Source**: GitHub Actions
   - **Custom domain**: `docs.tafy.studio` (will be set automatically by CNAME file)
   - **Enforce HTTPS**: Yes

## Step 6: Configure DNS

Add a CNAME record in your DNS provider:

- **Type**: `CNAME`
- **Name**: `docs`
- **Value**: `tafystudio.github.io`
- **TTL**: Auto or 3600

## Step 7: Initial Setup and Deploy

1. Commit and push the initial setup:

   ```bash
   cd tafystudio-docs
   git add .
   git commit -m "Initial Docusaurus setup"
   git push origin main
   ```

2. The GitHub Action will automatically:
   - Fetch documentation from the main repository
   - Build the Docusaurus site
   - Deploy to GitHub Pages

## Benefits of This Approach

1. **Separation of Concerns**: Documentation source stays with code, presentation layer is separate
2. **Modern Documentation Site**: Docusaurus provides search, versioning, and great UX
3. **Automatic Updates**: Scheduled builds ensure docs stay current
4. **Flexibility**: Can customize the docs site without touching main repo
5. **Performance**: Static site with excellent performance

## Maintenance

- Documentation content: Edit in `tafystudio/tafystudio` repository
- Site configuration: Edit in `tafystudio/tafystudio-docs` repository
- The site rebuilds automatically every 6 hours or on manual trigger
