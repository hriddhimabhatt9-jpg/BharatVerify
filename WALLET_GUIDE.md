# Part 2: Wallet Setup Guide

You need a **Private Key** to deploy your contracts to the blockchain. We will use **MetaMask** for this.

## Step A: Get Your Private Key
**⚠️ SECURITY WARNING**: Your Private Key grants full control over your assets. **NEVER** share it with anyone or paste it on public websites. You will only paste it into your local `.env` file.

1.  **Open MetaMask**:
    *   Click the **Fox Icon** 🦊 in your browser's extension bar (top right of Chrome/Edge/Firefox).
    *   Enter your password to unlock it if needed.

2.  **Open Account Options**:
    *   Looking at the MetaMask popup, you will see your account name (e.g., "Account 1") and balance usually in the middle.
    *   Look for the **three vertical dots** (⋮) in the top-right corner of the MetaMask popup (next to the account name or the circle icon).
    *   Click the **three dots** (⋮).

3.  **Navigate to Details**:
    *   In the menu that appears, click **Account details**.
    *   A new view will appear showing a QR code and your public address.

4.  **Reveal Private Key**:
    *   Click the button labeled **Show private key** (it looks like a red/white button).
    *   MetaMask will ask for your **MetaMask password** (the one you use to unlock the wallet) to confirm it's you. Enter it and click **Confirm**.
    *   **Press and hold** the "Hold to reveal Private Key" button if prompted (newer versions).

5.  **Copy the Key**:
    *   Your private key will be displayed (a long string of random characters, e.g., `8da4ef...`).
    *   Click the **Copy to clipboard** icon or select the text and copy it (`Ctrl+C`).
    *   **Done!** You now have your Private Key.

## Step B: Get Test Funds (Polygon Amoy)
You need "gas money" (POL tokens) to pay for the deployment.

1.  **Go to the Faucet**:
    *   Visit: [https://faucet.polygon.technology/](https://faucet.polygon.technology/)

2.  **Login/Connect**:
    *   You may need to "Login with Discord" or "Connect Wallet". Follow the prompts on the screen.

3.  **Request Tokens**:
    *   **Network**: Select **Polygon Amoy**.
    *   **Token**: Select **POL**.
    *   **Wallet Address**: Paste your public wallet address (starts with `0x...`, you can copy this from the main MetaMask screen by clicking your account name).
    *   Click **Submit** or **Confirm**.

4.  **Confirm**:
    *   Wait about 1-2 minutes.
    *   Check MetaMask. Your balance should increase (e.g., +1 POL).

## Step C: Add to Project
1.  Open your project file: `d:\BharatVerify\packages\contracts\.env`
2.  Paste the **Private Key** into the line `PRIVATE_KEY=...`.
3.  Save the file.
