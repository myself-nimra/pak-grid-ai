# PakGrid AI - Hostinger Deployment Guide

This guide provides step-by-step instructions for hosting **PakGrid AI** on **Hostinger**.

---

## Option 1: Hostinger Node.js Application Hosting (Recommended)

Hostinger supports Node.js application hosting directly via hPanel.

### Step 1: Connect GitHub Repository
1. Log in to your **Hostinger hPanel**.
2. Go to **Advanced** -> **Node.js** (or Web Applications).
3. Connect your GitHub account and select repository: `https://github.com/abu-bakar-iqbal/pakgridai`.
4. Select the `main` branch.

### Step 2: Configure Node.js Settings in hPanel
- **Node.js Version**: Select `18.x` or `20.x` (LTS).
- **Application Root**: `/` (Leave as default root directory).
- **Application Startup File**: `server.js` (or `npm start`).
- **Application Mode**: `Production`.

### Step 3: Set Environment Variables in Hostinger
In Hostinger hPanel -> Node.js Application -> **Environment Variables**, add the following keys (refer to `.env.example`):

| Variable Key | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Production Mode | `production` |
| `PORT` | Application Port | `3000` (or assigned port) |
| `NEXT_PUBLIC_SITE_URL` | Your Hostinger Domain | `https://yourdomain.com` |
| `GMAIL_USER` | Sender Email | `your-email@gmail.com` |
| `GMAIL_APP_PASSWORD` | Gmail 16-character App Password | `xxxx xxxx xxxx xxxx` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | `GOCSPX-xxxx` |

### Step 4: Run NPM Build & Start
1. Click **NPM Install** in hPanel to install dependencies.
2. Run build command: `npm run build`.
3. Click **Start Application** (or Restart Node.js Application).

---

## Option 2: Deploying on Hostinger VPS (Ubuntu / Nginx / PM2)

If using Hostinger VPS:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/abu-bakar-iqbal/pakgridai.git
   cd pakgridai
   ```

2. **Install Dependencies & Build**:
   ```bash
   npm install
   cp .env.example .env.local
   # Edit .env.local with your real keys
   npm run build
   ```

3. **Start with PM2**:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "pakgrid-ai"
   pm2 save
   pm2 startup
   ```

4. **Nginx Reverse Proxy Configuration**:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Option 3: Hostinger Static Web Hosting (Export)

If using basic Hostinger Shared Web Hosting without Node.js runtime:

1. Open `next.config.js` and change `output: 'standalone'` to `output: 'export'`.
2. Run `npm run build`. This generates an `out` folder containing static HTML/CSS/JS.
3. Upload all contents of the `out` folder to Hostinger `public_html` directory via File Manager or FTP.

---

## Troubleshooting Hostinger Deployments

- **Port Conflict**: Make sure `PORT` environment variable matches Hostinger's assigned port.
- **Google OAuth Domain**: Ensure your domain (`https://yourdomain.com`) is added to **Authorized JavaScript Origins** in Google Cloud Console.
- **Gmail SMTP OTP**: Ensure `GMAIL_APP_PASSWORD` is created from [Google App Passwords](https://myaccount.google.com/apppasswords) with 2FA enabled on your Gmail account.
