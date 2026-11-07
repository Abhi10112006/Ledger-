# 🛠️ Abhi's Ledger — Complete Installation & Deployment Guide

> **Official Installation & Developer Setup Manual**  
> *Target Environments:* Web (Browser / PWA), Android (Capacitor 8 / Native Hybrid)  
> *Version:* `4.0.0` (Fintech Enterprise & Direct In-App Updates)

---

## 📋 Table of Contents
1. [System Prerequisites](#1-system-prerequisites)
2. [Quick Start (Web Development)](#2-quick-start-web-development)
3. [Android Development Environment Setup](#3-android-development-environment-setup)
4. [Building for Android](#4-building-for-android)
5. [Generating Production Release Builds (APK / AAB)](#5-generating-production-release-builds-apk--aab)
6. [Native Plugins & Hardware Permissions](#6-native-plugins--hardware-permissions)
7. [Environment Variables & Configuration](#7-environment-variables--configuration)
8. [Troubleshooting & FAQ](#8-troubleshooting--faq)

---

## 1. System Prerequisites

Before getting started, verify that your machine has the following tools installed:

### Required for All Platforms:
| Tool | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.0.0` | `v20.x` or `v22.x` (LTS) | `node -v` |
| **npm** | `9.0.0` | `10.x+` | `npm -v` |
| **Git** | `2.30+` | `2.40+` | `git --version` |

### Required for Android Builds:
| Tool | Requirement | Notes |
| :--- | :--- | :--- |
| **Java Development Kit (JDK)** | **JDK 17** or **JDK 21** | Eclipse Temurin / OpenJDK recommended |
| **Android Studio** | Ladybug / Koala / Hedgehog (2023.3+) | Bundles Android SDK, Build-Tools, and AVD |
| **Android SDK Platform** | **API 34 / 35** (Android 14 / 15) | Configured in Android Studio SDK Manager |
| **Android SDK Build-Tools** | `34.0.0+` | Installed via SDK Tools |
| **Android SDK Command-line Tools** | Latest | Required for headless builds |

---

## 2. Quick Start (Web Development)

You can run **Abhi's Ledger** locally in any modern web browser within minutes:

### Step 1: Clone the Repository
```bash
git clone https://github.com/Abhi10112006/Ledger-.git
cd Ledger-
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Start the Vite Dev Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173/`.  
Hot Module Replacement (HMR) is enabled by default.

### Step 4: Build for Web Production
```bash
npm run build
```
The optimized web distribution files will be generated in the `dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

---

## 3. Android Development Environment Setup

To compile and run the native Android hybrid application, your environment variables must be properly configured.

### Windows (PowerShell):
Add the following to your User Environment Variables (or `$PROFILE`):
```powershell
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Android\Android Studio\jbr", "User")
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
```
Append the Android SDK tools to your `PATH`:
```powershell
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$pathsToAdd = "$sdk\platform-tools;$sdk\cmdline-tools\latest\bin;$sdk\build-tools\34.0.0"
[System.Environment]::SetEnvironmentVariable("Path", $env:Path + ";" + $pathsToAdd, "User")
```

### macOS / Linux (Bash / Zsh):
Add the following to `~/.bashrc` or `~/.zshrc`:
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" # macOS
# On Linux: export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
export ANDROID_HOME="$HOME/Library/Android/sdk" # macOS
# On Linux: export ANDROID_HOME="$HOME/Android/Sdk"

export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

Verify your setup by running:
```bash
adb --version
```

---

## 4. Building for Android

Abhi's Ledger uses **Capacitor 8** paired with customized native Android plugins. Follow these steps to build:

### Step 1: Build the Web Assets
Every time you make frontend changes, build the web distribution bundle:
```bash
npm run build
```

### Step 2: Synchronize with Native Android Project
Copy the web build and update native Capacitor plugins:
```bash
npx cap sync android
```

### Step 3: Open in Android Studio
Launch Android Studio with the project loaded:
```bash
npx cap open android
```
*Wait for Gradle to finish indexing and downloading dependencies.*

### Step 4: Run from Command Line (Optional)
If you prefer command-line compilation without launching Android Studio:
```bash
# Navigate to the Android project directory
cd android

# Windows
.\gradlew.bat assembleDebug

# macOS / Linux
chmod +x gradlew
./gradlew assembleDebug
```
The compiled debug APK will be created at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

To install directly to a connected device or running emulator:
```bash
# Windows
.\gradlew.bat installDebug

# macOS / Linux
./gradlew installDebug
```

---

## 5. Generating Production Release Builds (APK / AAB)

For publishing to Google Play Store or sideloading an optimized production build:

### Step 1: Create a Release Keystore (One-Time)
Run the Java `keytool` command to generate a cryptographic key:
```bash
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias ledger-key
```
> [!CAUTION]
> Back up your `release-key.jks` and credentials safely. If you lose your key, you will not be able to update your application on Google Play.

### Step 2: Configure Gradle Signing Credentials
Create `android/keystore.properties` (this file is excluded by `.gitignore`):
```properties
storeFile=../../release-key.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=ledger-key
keyPassword=YOUR_KEY_PASSWORD
```

### Step 3: Build Signed Android App Bundle (AAB for Google Play)
```bash
cd android
./gradlew bundleRelease
```
The bundle will be generated at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Step 4: Build Standalone Release APK
```bash
cd android
./gradlew assembleRelease
```
The APK will be generated at:
```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```
(Or signed directly if configured in `buildTypes.release`).

---

## 6. Native Plugins & Hardware Permissions

Abhi's Ledger integrates 7 specialized custom native Android plugins and background receivers located in `android/app/src/main/java/com/abhisledger/app/`:

1. **`NativeAppUpdatePlugin.java` & `AppUpdateBroadcastReceiver.java`**:
   - Streams APK updates directly in-flight with live percentage progress reporting and notification drawer updates.
   - Automatically triggers Android native package installer prompt (`Intent.ACTION_VIEW` with `FileProvider` URI).
   - Listens to `AlarmManager` repeating alarms every 12 hours and `BOOT_COMPLETED` to check for updates and alert via system notifications.
2. **`NativeContactsPlugin.java`**:
   - Queries the device `ContentResolver` for contact display name, phone numbers, and avatars in $<35\text{ ms}$.
   - Requires runtime permission: `android.permission.READ_CONTACTS`.
3. **`NativeBackupPlugin.java`**:
   - Implements hardware-backed **AES-256-GCM** encryption and integrates with Android's **Storage Access Framework (SAF)** to write encrypted `.ledger` files directly to user-chosen storage without invasive storage permissions.
4. **`NativeThemeIconPlugin.java`**:
   - Dynamically toggles 10 launcher `<activity-alias>` targets via `PackageManager.setComponentEnabledSetting` with `DONT_KILL_APP` flag.
5. **`NativeSecurityPlugin.java`**:
   - Provides hardware Android KeyStore backing for the 6-digit Master PIN and cryptographic verification.
6. **`NativeTypographyPlugin.java`**:
   - Enforces WebView hardware acceleration layers and subpixel font antialiasing flags.
7. **Biometric Authentication (`@capgo/capacitor-native-biometric`)**:
   - Hooks into Android `BiometricPrompt` API for Fingerprint and Face Unlock with a fallback 6-digit salted PIN screen.

All required permissions are declared in [`android/app/src/main/AndroidManifest.xml`](file:///C:/Users/abhin/Downloads/ledger/android/app/src/main/AndroidManifest.xml).

---

## 7. Environment Variables & Configuration

### `.env.local` (Optional)
```env
# Optional API configuration
GEMINI_API_KEY=your_key_here
```
> Note: Abhi's Ledger is 100% offline-first. No external API key is strictly required for core ledger operations, trust score computation, or biometric security.

---

## 8. Troubleshooting & FAQ

### Q: Gradle build fails with "Unsupported class file major version"
- **Cause:** Incompatible Java version. Gradle 8.x / 9.x requires JDK 17 or JDK 21.
- **Fix:** Ensure `java -version` returns JDK 17 or 21. In Android Studio, go to `Settings > Build, Execution, Deployment > Build Tools > Gradle` and ensure **Gradle JDK** points to **Embedded JDK 17/21**.

### Q: Capacitor sync throws "Capacitor plugin not found"
- **Fix:** Run a clean reinstall and resync:
  ```bash
  npm clean-install
  npm run build
  npx cap sync android
  ```

### Q: Biometrics fails on Android Emulator
- **Fix:** In the Android Emulator extended controls (`...`), go to **Fingerprint**, enable simulated touch, and register a fingerprint under Android system settings.

### Q: SQLite plugin doesn't persist data on Android
- **Fix:** Ensure `jeep-sqlite` web component is loaded for web/dev environments, and verify the Android manifest contains the required SQLite room permissions. Android uses the native driver automatically.

---

**[⬅ Back to Main README](README.md)**
