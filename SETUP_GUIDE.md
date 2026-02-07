# detailed Setup Guide

Follow these specific steps to get the required keys for your setup.

## Part 1: Firebase Service Account Key
This key allows your backend scripts to authenticate as an "Admin" to manage your database and users.

1.  **Go to Firebase Console**:
    - Open your browser and go to [https://console.firebase.google.com/](https://console.firebase.google.com/).
    - Click on your project: **BharatVerify** (or `bharatverify-app-v1`).

2.  **Navigate to Service Accounts**:
    - Click the **Gear Icon** ⚙️ next to "Project Overview" in the top left sidebar.
    - Select **Project settings**.
    - Click on the **Service accounts** tab (top horizontal menu).

3.  **Generate Private Key**:
    - Scroll down to the "Firebase Admin SDK" section.
    - Click the button **Generate new private key**.
    - A warning popup will appear; click **Generate key**.
    - A `.json` file will download to your computer.

4.  **Add to Environment File**:
    - Open the downloaded `.json` file with a text editor (Notepad, VS Code, etc.).
    - Copy the **entire content** (it starts with `{` and ends with `}`).
    - Open your project file: `d:\BharatVerify\apps\web\.env.local`.
    - Find the line `FIREBASE_SERVICE_ACCOUNT_KEY=`.
    - Paste the JSON string *immediately after* the equals sign.
    - **Important**: The JSON string must be on a **single line**. If you paste it and it spans multiple lines, make sure to delete the line breaks so it is one long string.
        - *Tip*: You can wrap the whole JSON string in single quotes `'` if you want, but usually it works without if there are no spaces in weird places. Single quotes are safer.

## Part 2: Wallet Private Key
This key allows the script to deploy your smart contract to the blockchain. You need a wallet (like MetaMask) with some test funds.

1.  **Get Test Funds (if you haven't)**:
    - You are deploying to **Polygon Amoy Testnet**.
    - Go to [Polygon Faucet](https://faucet.polygon.technology/).
    - Connect your wallet or paste your wallet address.
    - Request **POL** tokens.

2.  **Export Private Key (MetaMask)**:
    - Open your MetaMask extension.
    - Click the **three dots** ⋮ (top right).
    - Select **Account Details**.
    - Click **Show Private Key**.
    - Enter your MetaMask password to confirm.
    - Copy the private key (it usually starts with `0x...` or just hex characters).

3.  **Add to Environment File**:
    - Open your project file: `d:\BharatVerify\packages\contracts\.env`.
    - Find the line `PRIVATE_KEY=`.
    - Paste your private key there. 
    - *Security Note*: Never share this file or commit it to GitHub.

## Part 3: Resume Setup
Once you have saved both `.env.local` and `.env` files:
1.  Return to the chat.
2.  Tell me "I have updated the files" or click "Resume" if available.
3.  I will then proceed to run the admin script and deploy the contracts.
