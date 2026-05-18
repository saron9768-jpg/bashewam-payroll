# Host Bashewam Payroll on Google (Firebase Hosting)

Firebase Hosting is Google's free static hosting. Your site will get a public URL like `https://your-project.web.app` that teachers can open and that Google can index.

## Before you deploy

1. **Change the demo password** in `login.js` (`DEMO_USER` / `DEMO_PASS`) — the defaults are only for testing.
2. **Replace placeholders** after you create your Firebase project:
   - `.firebaserc` → set `YOUR_FIREBASE_PROJECT_ID`
   - `robots.txt` → replace `YOUR_FIREBASE_PROJECT_ID` in the Sitemap URL
   - `sitemap.xml` → replace both `YOUR_FIREBASE_PROJECT_ID` URLs
   - `login.html` → update the `canonical` link with your real URL

## One-time setup (on your computer)

### 1. Install Node.js

Download from https://nodejs.org/ (LTS) if you do not have it.

### 2. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 3. Log in to Google

```bash
firebase login
```

Use the Google account you want for hosting (school Gmail is fine).

### 4. Create a Firebase project

1. Open https://console.firebase.google.com/
2. Click **Add project**
3. Name it e.g. `bashewam-school-payroll`
4. Copy the **Project ID** (lowercase, no spaces)
5. Paste it into `.firebaserc` instead of `YOUR_FIREBASE_PROJECT_ID`
6. Update `robots.txt`, `sitemap.xml`, and `login.html` canonical with:  
   `https://YOUR_PROJECT_ID.web.app`

## Deploy the site

In PowerShell, go to this folder:

```bash
cd C:\Users\Saron\Desktop\bashewam-payroll
firebase deploy --only hosting
```

When it finishes, you will see:

- **Hosting URL:** `https://YOUR_PROJECT_ID.web.app`
- Sign-in page: `https://YOUR_PROJECT_ID.web.app/login.html` (also opens at `/`)

Share that link with teachers. To update the site later, run `firebase deploy --only hosting` again.

## Optional: custom domain

In Firebase Console → **Hosting** → **Add custom domain**, you can connect e.g. `payroll.bashewamschool.com` if your school owns a domain.

## Help teachers find it on Google Search

Indexing takes days or weeks; you must submit the site once.

### 1. Google Search Console

1. Go to https://search.google.com/search-console/
2. **Add property** → URL prefix → your Hosting URL  
   `https://YOUR_PROJECT_ID.web.app`
3. Verify ownership (HTML file or DNS — Firebase Hosting verification is documented in Search Console)

### 2. Submit sitemap

In Search Console → **Sitemaps** → add:

```
https://YOUR_PROJECT_ID.web.app/sitemap.xml
```

### 3. Request indexing

In Search Console → **URL inspection** → paste your login URL → **Request indexing**.

### 4. Search-friendly names

Teachers may search for:

- Bashewam School payroll
- Bashewam staff portal

The login page title and description are already set for that. A custom domain with "bashewam" in the name helps even more.

## Important notes

- **Data stays in each browser** (localStorage). Hosting does not sync payroll between devices; that would need a database later.
- **HTTPS** is automatic on Firebase.
- Keep login credentials private; only share the URL and individual usernames/passwords with authorized staff.
