# TipSum 🧾

A smart bill and tip calculator conforming to a single-cent checksum rule for tamper-proof restaurant bills.

## How the Checksum Works
For any total formatted with two decimal places (e.g. **$46.11**):
The sum of all digits preceding the last cent digit is calculated. The single-cent digit must equal the ones-value of this sum.
- Example: **46.11** $\rightarrow$ $4 + 6 + 1 = 11$. The ones-digit of $11$ is **$1$**, which matches the final cent digit **$._1$**.

By writing a tip that forces your receipt total to conform to this checksum, any typo or unauthorized alteration made when a server or cashier enters the receipt into the POS terminal will immediately fail the check when you review your credit card or bank statements!

## Features
- **Mobile First**: Fast, high-density, above-the-fold interface optimized for phone screens.
- **Dual Input Modes**:
  - Pre-Tax Subtotal + Tax
  - Total Bill + Tax (automatically reverse-computes pre-tax subtotal)
- **Pre-Computed Tiers**: Computes the exact "just over" tips for **10%**, **15%**, **20%**, and **25%**.
- **Interactive Checksum Proof**: Visual digit breakdown and summation verification.
- **Receipt & Signature Slip**: Simulated merchant copy receipt with bill splitting and one-click copy.
- **History**: Stores your recent receipts in your browser's `localStorage` for statement auditing.
- **100% Free Static Hosting**: Pre-configured for GitHub Pages deployment.

## GitHub Pages Deployment
This repository is configured to deploy directly to GitHub Pages:
1. Go to your repository **Settings** $\rightarrow$ **Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Every push to `main` triggers `.github/workflows/deploy.yml` and updates your live site at `https://<username>.github.io/tipsum/`.
