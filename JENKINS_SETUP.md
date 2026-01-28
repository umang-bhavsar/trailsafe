# Jenkins CI/CD Setup for TrailSafe

## Prerequisites
- macOS with Homebrew installed
- GitHub account with repo access
- Expo account (free) at https://expo.dev

---

## Step 1: Install Jenkins on your Mac

```bash
# Install Jenkins via Homebrew
brew install jenkins-lts

# Start Jenkins
brew services start jenkins-lts
```

Jenkins will run at **http://localhost:8080**

---

## Step 2: Initial Jenkins Setup

1. Open http://localhost:8080 in your browser
2. Get the initial admin password:
   ```bash
   cat /Users/$(whoami)/.jenkins/secrets/initialAdminPassword
   ```
3. Paste the password and click **Continue**
4. Click **Install suggested plugins** (wait for installation)
5. Create your admin user
6. Keep the default Jenkins URL (http://localhost:8080)

---

## Step 3: Install Required Jenkins Plugins

Go to **Manage Jenkins → Plugins → Available plugins** and install:
- **NodeJS Plugin**
- **GitHub Integration Plugin**
- **Pipeline** (usually pre-installed)

Restart Jenkins after installing.

---

## Step 4: Configure Node.js in Jenkins

1. Go to **Manage Jenkins → Tools**
2. Scroll to **NodeJS installations**
3. Click **Add NodeJS**
   - Name: `Node 20`
   - Version: `20.x`
4. Click **Save**

---

## Step 5: Add Expo Token to Jenkins

1. Get your Expo token:
   ```bash
   npx eas-cli login
   npx eas-cli credentials --platform android
   # Or get token from https://expo.dev/settings/access-tokens
   ```

2. In Jenkins, go to **Manage Jenkins → Credentials → System → Global credentials**
3. Click **Add Credentials**
   - Kind: **Secret text**
   - Secret: (paste your EXPO_TOKEN)
   - ID: `expo-token`
   - Description: `Expo CLI Token`
4. Click **Create**

---

## Step 6: Create the Jenkins Pipeline Job

1. From Jenkins dashboard, click **New Item**
2. Enter name: `TrailSafe-CI`
3. Select **Pipeline** and click **OK**
4. Under **Pipeline**, select:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/YOUR_USERNAME/trailsafe.git`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
5. Click **Save**

---

## Step 7: Configure GitHub Webhook (Optional - for auto-builds)

1. In your GitHub repo, go to **Settings → Webhooks → Add webhook**
2. Payload URL: `http://YOUR_IP:8080/github-webhook/`
   - For local testing, use [ngrok](https://ngrok.com) to expose localhost
3. Content type: `application/json`
4. Select **Just the push event**
5. Click **Add webhook**

---

## Step 8: Run Your First Build

1. Go to your `TrailSafe-CI` job
2. Click **Build Now**
3. Watch the build progress in **Console Output**

---

## What the Pipeline Does

| Stage | Action |
|-------|--------|
| Checkout | Pulls code from GitHub |
| Setup Node | Ensures Node.js 20 is available |
| Install Dependencies | Runs `npm ci` |
| TypeScript Check | Runs `tsc --noEmit` |
| EAS Build - Android | Triggers cloud build for Android APK |
| EAS Build - iOS | Triggers cloud build for iOS (simulator) |

---

## First-Time EAS Setup

Before Jenkins can build, run this once locally:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Initialize EAS for your project (if not done)
eas build:configure

# Test a build manually
eas build --platform android --profile preview
```

---

## Troubleshooting

### "nvm: command not found"
Install nvm first:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

### "EXPO_TOKEN not found"
Make sure you created the credential with ID exactly `expo-token`

### iOS build fails
For real device builds, you need an Apple Developer account ($99/year).  
The `preview` profile builds for **simulator only** (free).

---

## Resume Bullet Points

After completing this setup, you can say:

- "Configured **Jenkins CI/CD pipeline** for React Native/Expo app with automated TypeScript checks and mobile builds"
- "Integrated **EAS Build** with Jenkins for Android APK and iOS simulator builds on every commit"
- "Set up **GitHub webhooks** for automated pipeline triggers on push events"
