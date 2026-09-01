# Civic Lens — Deployment & Repo Rename Checklist

Complete this checklist to finalize Civic Lens for production deployment and public GitHub release.

---

## Phase 1: GitHub Repository Setup

### 1.1 Rename the repository

> **Note:** This step can only be done from GitHub's web interface or via the GitHub CLI.

#### Option A: Via GitHub Web Interface

1. Navigate to your repository on GitHub: `https://github.com/<username>/civiq`
2. Click **Settings** (top right, gear icon)
3. Scroll to the **Danger Zone** section
4. Click **Rename** and change:
   - **From:** `civiq`
   - **To:** `civic-lens` (or `civiclens`)
5. Click **I understand, rename this repository**
6. GitHub automatically updates all references

#### Option B: Via GitHub CLI

```bash
gh repo rename civic-lens --repo <username>/civiq
```

### 1.2 Update local Git remote

After renaming on GitHub, update your local repository:

```bash
cd "/Users/prathamkashyap/Documents/Google Classroom.nosync/3rd Year (2025-26)/Fall Semester 2025-26/DSN3099 EPICS"
git remote set-url origin https://github.com/<username>/civic-lens.git
```

Verify the change:

```bash
git remote -v
```

### 1.3 Update repository description and metadata

1. Go to repository **Settings** → **General**
2. Update the **Description** to:
   ```
   A civic intelligence platform for reporting, prioritizing, and visualizing urban issues
   ```
3. Set the **Website** to your public domain (optional, fill after deployment)
4. Add **Topics:** `civic-tech`, `ml`, `firebase`, `react`, `geospatial`

---

## Phase 2: Environment Configuration

### 2.1 Gather Firebase credentials

From your Firebase Console (`https://console.firebase.google.com`):

1. Select your Firebase project
2. Click **Settings** (gear icon) → **Project Settings**
3. Copy the following values:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`

### 2.2 Create local `.env.local` file

Create `app/.env.local` (never commit this):

```env
VITE_FIREBASE_API_KEY=<your-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-domain>
VITE_FIREBASE_PROJECT_ID=<your-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>
VITE_FIREBASE_MEASUREMENT_ID=<your-measurement-id>
```

### 2.3 Verify `.env` and `.env.local` are in `.gitignore`

```bash
cd app
cat .gitignore | grep -E "\.env|\.env\."
```

Expected output should show both `.env` and `.env.local` listed.

---

## Phase 3: Local Build & Testing

### 3.1 Install dependencies

```bash
cd "/Users/prathamkashyap/Documents/Google Classroom.nosync/3rd Year (2025-26)/Fall Semester 2025-26/DSN3099 EPICS/app"
npm install
```

### 3.2 Run development server

```bash
npm run dev
```

- Open `http://localhost:5173` in your browser
- Verify the app loads without console errors
- Test Firebase Auth (login/logout flow)
- Verify the dashboard displays correctly

### 3.3 Build for production

```bash
npm run build
```

Expected output:
```
✓ built in X.XXs
```

Verify the `dist/` folder was created with the following structure:

```
dist/
  ├── index.html
  ├── assets/
  │   ├── index-<hash>.css
  │   └── index-<hash>.js
  └── [other static assets]
```

### 3.4 Test production build locally

```bash
npm run preview
```

- Open `http://localhost:4173` in your browser
- Verify the production build works correctly

---

## Phase 4: Vercel Deployment

### 4.1 Connect GitHub to Vercel

1. Go to `https://vercel.com`
2. Sign in (or create an account)
3. Click **Add New Project**
4. Click **Import Git Repository**
5. Search for and select `<username>/civic-lens`
6. Click **Import**

### 4.2 Configure Vercel project settings

1. **Project Name:** Set to `civic-lens`
2. **Framework Preset:** Select `Vite`
3. **Root Directory:** Set to `./app`
4. **Build Command:** Leave as default (`npm run build`)
5. **Output Directory:** Leave as default (`dist`)
6. **Install Command:** Leave as default (`npm install`)

### 4.3 Add environment variables to Vercel

1. Scroll to **Environment Variables** section
2. Add all Firebase credentials:
   - Key: `VITE_FIREBASE_API_KEY`, Value: `<your-key>`
   - Key: `VITE_FIREBASE_AUTH_DOMAIN`, Value: `<your-domain>`
   - Key: `VITE_FIREBASE_PROJECT_ID`, Value: `<your-project-id>`
   - Key: `VITE_FIREBASE_STORAGE_BUCKET`, Value: `<your-bucket>`
   - Key: `VITE_FIREBASE_MESSAGING_SENDER_ID`, Value: `<your-sender-id>`
   - Key: `VITE_FIREBASE_APP_ID`, Value: `<your-app-id>`
   - Key: `VITE_FIREBASE_MEASUREMENT_ID`, Value: `<your-measurement-id>`
3. For each, select the **Production** environment checkbox

### 4.4 Deploy

1. Click **Deploy**
2. Wait for the deployment to complete (typically 1–3 minutes)
3. Vercel will provide a deployment URL: `https://civic-lens.vercel.app`

### 4.5 Verify deployment

- Open the deployment URL in your browser
- Verify the app loads correctly
- Test Firebase Auth functionality
- Check browser console for errors

---

## Phase 5: Custom Domain Setup (Optional)

### 5.1 Connect a custom domain to Vercel

1. Go to your Vercel project **Settings** → **Domains**
2. Click **Add**
3. Enter your custom domain (e.g., `civiclens.io`)
4. Follow Vercel's DNS configuration instructions
5. Update DNS records at your domain registrar

### 5.2 Update repository metadata

1. Update your GitHub repository description to include the public URL
2. Update the **Website** field in GitHub Settings with the custom domain

---

## Phase 6: Pre-Launch Verification

- [ ] GitHub repository renamed to `civic-lens`
- [ ] Repository remote URL updated locally
- [ ] Firebase credentials validated and stored securely
- [ ] Local development build passes (`npm run dev`)
- [ ] Local production build passes (`npm run build`)
- [ ] Production preview works (`npm run preview`)
- [ ] Vercel deployment completed successfully
- [ ] App loads and functions correctly at deployment URL
- [ ] Firebase Auth flows work (sign up, login, logout)
- [ ] Dashboard displays without errors
- [ ] No sensitive credentials visible in source code or browser console
- [ ] `.env` and `.env.local` are in `.gitignore`
- [ ] README links updated to match new repo name (if needed)

---

## Phase 7: Post-Launch Steps

### 7.1 Update documentation links

If you've created any external documentation or have links in other repos, update them:

```
OLD: https://github.com/<username>/civiq
NEW: https://github.com/<username>/civic-lens
```

### 7.2 Add deployment badges to README

Update `README.md` with deployment status:

```markdown
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel&logoColor=white)](https://civic-lens.vercel.app)
```

### 7.3 Set up continuous deployment

Vercel automatically deploys on every push to `main`. Verify that:

1. Merges to `main` trigger automatic builds
2. Failed builds trigger email notifications
3. All environment variables are present in the production environment

### 7.4 Monitor deployment health

1. Set up Vercel Analytics (optional)
2. Monitor error logs in Vercel Dashboard
3. Review Firebase Console for authentication and database activity

---

## Phase 8: ML Pipeline Integration (Optional)

If you want the dashboard to consume fresh ML outputs:

### 8.1 Run the ML pipeline

```bash
cd "/Users/prathamkashyap/Documents/Google Classroom.nosync/3rd Year (2025-26)/Fall Semester 2025-26/DSN3099 EPICS/ml"
python -m pip install -r requirements.txt
python run_pipeline.py
```

### 8.2 Verify exported JSON files

Check that the following files were generated in `app/public/`:

- `priority_results.json`
- `hotspot_summary.json`
- `category_priority_matrix.json`
- `risk_score_bins.json`

### 8.3 Deploy updated dashboard

```bash
cd ../app
npm run build
# Vercel will automatically deploy the changes
git add .
git commit -m "Update: refresh ML-generated dashboard data"
git push origin main
```

---

## Troubleshooting

### Build fails locally

```bash
# Clear cache and reinstall
cd app
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Firebase connection fails

- Verify all environment variables are correctly set
- Check Firebase Console for API key restrictions
- Ensure CORS is properly configured in Firebase Security Rules

### Vercel deployment fails

1. Check the Vercel deployment logs:
   - Go to **Deployments** in Vercel Dashboard
   - Click the failed deployment to view logs

2. Verify environment variables are set in Vercel:
   - Go to **Settings** → **Environment Variables**

3. Ensure `app/.env.local` is not committed to the repository

### Custom domain DNS not resolving

- Allow 24–48 hours for DNS propagation
- Verify DNS records are correctly configured at your domain registrar
- Use `dig` or `nslookup` to check DNS status:
  ```bash
  dig civiclens.io
  ```

---

## Final Checklist Before Public Release

- [ ] GitHub repo is public and properly named
- [ ] Repository has a clear description and topic tags
- [ ] README is polished and includes badges
- [ ] LICENSE file is present (MIT recommended)
- [ ] All stale naming references have been removed
- [ ] Firebase credentials are never committed
- [ ] Deployment URL is working and public
- [ ] Analytics and error tracking are configured (optional)
- [ ] Team members have access (if collaborative)
- [ ] Documentation is complete and accurate

---

## Next Steps

1. Follow this checklist step-by-step
2. After successful deployment, share the public URL: `https://github.com/<username>/civic-lens`
3. If issues arise, check the **Troubleshooting** section
4. For ongoing maintenance, monitor error logs in Vercel and Firebase Consoles

**Good luck with the launch! 🚀**
