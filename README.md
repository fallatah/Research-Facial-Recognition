
# Facial Recognition

## Abstract
This project presents a lightweight, fully reproducible pipeline for automated student-engagement detection using classical computer-vision methods implemented entirely in the browser. The system processes single still images and extracts interpretable facial features through OpenCV’s Histogram of Oriented Gradients descriptors and Haar-cascade classifiers. Unlike deep neural approaches, the proposed method emphasizes transparency, low computational load, and real-time deployability on standard educational devices. The pipeline performs face, eye, and smile detection, edge-based saliency analysis, and grayscale feature extraction through a client-side build of OpenCV using ReactJS, a framework built using JavaScript.

---

## Prerequisites

Before running the application locally, ensure you have the following installed:

- Node.js (LTS version recommended)
- npm (bundled with Node.js)
- Git (optional but recommended)

---

## Installing Node.js and npm

### macOS

#### Method 1: Official Installer
1. Go to https://nodejs.org
2. Download the macOS Installer (.pkg) for the LTS version
3. Open the installer and follow the instructions
4. Verify installation in Terminal:
   ```
   node -v
   npm -v
   ```

#### Method 2: Homebrew
```
brew update
brew install node
```

---

### Windows

1. Visit https://nodejs.org
2. Download the Windows Installer (.msi) for the LTS version
3. Run the installer and complete the setup
4. Verify installation in Command Prompt or PowerShell:
   ```
   node -v
   npm -v
   ```

---

## Cloning the Repository

```
git clone <your-repo-url>
cd <project-folder>
```

If downloaded as ZIP, extract it and open the folder.

---


## Running the App Locally

```
cd app
npm install
npm run dev
```

The application will be available at:

http://localhost:3000/

Other users can reach this app if they are connected to your local network via:
http://192.168.100.82:3000