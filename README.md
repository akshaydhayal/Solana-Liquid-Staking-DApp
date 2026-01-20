# LST Manager – Solana Liquid Staking DApp

Single README covering the on-chain program and the React/Tailwind frontend.

---

## Overview
- **Goal:** Let users deposit SOL and receive a liquid staking token (LST), request redemptions, and claim SOL after cooldown. Admin stakes vault SOL to validators and manages withdrawals.
- **Program language:** Rust (native Solana program, no Anchor).
- **Frontend:** React + Vite + Tailwind, Solana wallet adapter, Recoil state.
- **Network:** Defaults to `devnet` in the frontend.

---

### User Demo
Complete user flow : connecting wallet → staking SOL → receiving LST → unstaking dSOL → waiting for cooldown → claiming SOL
![Demo](https://github.com/akshaydhayal/Solana-LST-Manager-Program/blob/main/user_demo.gif)

### Admin Demo
Complete admin flow : connecting admin wallet → staking vault SOL to validator → unstaking for epoch → withdrawing from split stake → users claiming SOL
![Demo](https://github.com/akshaydhayal/Solana-LST-Manager-Program/blob/main/admin_demo.gif)

## Program Architecture
### Core PDAs (seeds → purpose)
- `["lst_manager", bump]` → LST manager state (admin, mint, totals).
- `["lst_manager_vault", lst_manager, bump]` → SOL vault escrow.
- `["lst_manager_user_withdrawl_vault", lst_manager, bump]` → SOL escrow for user withdrawals.
- `["lst_mint", lst_manager, bump]` → LST mint authority set to `lst_manager`.
- `["stake_registry_record", lst_manager, bump]` → Tracks `next_stake_index` and `next_split_index`.
- `["stake_acc", stake_index, lst_manager, bump]` → Stake accounts delegated to validators.
- `["split_stake_acc", split_index, lst_manager, bump]` → Deactivated split stakes used for withdrawals.
- `["user_withdraw_request", user, bump]` → Per-user pending withdrawal info.
- `["epoch_withdraw", epoch, bump]` → Per-epoch aggregate withdraw request for unstaking.

### On-chain State
- `LSTManager`  
  - `admin: Pubkey`  
  - `lst_mint: Pubkey`  
  - `total_sol_staked: u64`  
  - `total_lst_supply: u64`  
  - `total_pending_withdrawl_sol: u64`
- `StakeRegistryRecord`  
  - `next_stake_index: u64`  
  - `next_split_index: u64`
- `UserWithdrawRequest`  
  - `user: Pubkey`  
  - `sol_amount_user_gets: u64`  
  - `requested_epoch: u64`  
  - `withdraw_status: PENDING | COMPLETED`
- `EpochWithdraw`  
  - `sol_amount_to_unstake: u64`  
  - `requested_epoch: u64`  
  - `finalised: bool`

### Instruction Reference (contract/src/instruction.rs)
1) **InitialiseLST**  
   - Creates PDAs: `lst_manager`, `lst_manager_vault`, `lst_manager_user_withdrawl_vault`, `lst_mint`, `stake_registry_record`.  
   - Sets admin (signer), initializes mint (9 decimals), seeds stake registry indices to 1.
2) **DepositSOLToVault** (user)  
   - Transfers SOL → vault; mints LST to user ATA using dynamic exchange rate from total SOL/LST.  
   - Updates `total_lst_supply`.
3) **StakeVaultSOLToValidator** (admin)  
   - Creates stake PDA (by next stake index), funds from vault, initializes and delegates to validator vote account.  
   - Increments `next_stake_index`; updates `total_sol_staked`.
4) **BurnLstToRedeemSOL** (user)  
   - Burns LST from user ATA, computes SOL owed (rate from total SOL/LST).  
   - Creates/updates `user_withdraw_request` and `epoch_withdraw` PDAs.  
   - Increments `total_pending_withdrawl_sol`; decrements `total_lst_supply`.
5) **UnstakeSOLFromValidator** (admin)  
   - For an epoch’s requests: splits a stake account into `split_stake_acc`, deactivates it, marks epoch withdraw finalised.  
   - Updates `total_sol_staked` and `next_split_index`.
6) **WithdrawFromSplitStake** (admin)  
   - Withdraws lamports from a deactivated `split_stake_acc` into `lst_manager_user_withdrawl_vault`.
7) **ClaimSOLFromWithdrawVault** (user)  
   - After cooldown (epoch >= requested_epoch + 1), transfers SOL from user withdraw vault to user and marks request `COMPLETED`.  
   - Decrements `total_pending_withdrawl_sol`.

---

## Frontend (frontend/)
### Tech
- React 18, Vite, TypeScript, Tailwind CSS, Recoil, Solana wallet adapter (React UI).
- Toast notifications via `react-hot-toast` with clickable Solana Explorer links.
- Defaults to `clusterApiUrl("devnet")`.

### UI Design
- **Dark Theme**: Consistent dark theme throughout with gray-950/gray-900 backgrounds.
- **Color Accents**: Strategic use of gradients and colored borders:
  - Blue/Purple for staking operations
  - Orange/Red for unstaking operations
  - Green/Emerald for successful actions and active states
  - Purple/Pink for admin withdrawal operations
- **Compact Layout**: Optimized spacing and sizing (approximately 90% scale) for a clean, modern interface.
- **Responsive Design**: Mobile-friendly grid layouts and adaptive components.
- **Transaction Feedback**: All successful transactions display friendly toast notifications with clickable Solana Explorer links (devnet).

### Running locally
```bash
cd frontend
npm install
npm run dev   # Vite dev server
```

### Key Screens & Flows
- **Navbar**: Connect wallet (wallet adapter UI), shows app brand with gradient logo and title.
- **User Dashboard** (`UserPage`):
  - Stats grid (TVL, LST supply, APY, exchange rate, active staked SOL, pending withdrawals).
  - **Stake SOL**: 
    - Input validation prevents staking more than available balance.
    - Sends `DepositSOLToVault`; mints LST to user ATA.
    - Shows friendly toast notification with Explorer link.
  - **Unstake dSOL**: 
    - Input validation prevents unstaking more than available LST balance.
    - Sends `BurnLstToRedeemSOL`; creates/updates withdraw request and epoch withdraw PDAs.
    - Shows friendly toast notification with Explorer link.
  - **Pending Withdrawals**: 
    - Shows current request with epoch information.
    - If epoch passed, enables claim button (calls `ClaimSOLFromWithdrawVault`).
    - Shows friendly toast notification with Explorer link on successful claim.
  - Info card: Process steps with colored left borders.
- **Admin Dashboard** (`AdminPage`):
  - Stats grid with same metrics as user dashboard.
  - **Stake Vault SOL to Validator**: 
    - Dropdown to select validator vote account (fetches all available validators).
    - Displays available vault balance.
    - Calls `StakeVaultSOLToValidator` (admin only).
    - Shows friendly toast notification with Explorer link.
  - **Unstake SOL**: 
    - Dropdown to select stake account.
    - Calls `UnstakeSOLFromValidator` to split/deactivate stake for an epoch (admin only).
    - Shows friendly toast notification with Explorer link.
  - **Withdraw from Split Stake**: 
    - Displays available withdraw vault balance.
    - Dropdown to select split stake account (only withdrawable accounts enabled).
    - Calls `WithdrawFromSplitStake` to move SOL to user-withdraw vault (admin only).
    - Shows friendly toast notification with Explorer link.
  - Lists active stake accounts and split stake accounts with readiness flags and detailed information.

### Environment / Constants
- PDAs and program ID are defined in `frontend/src/lib/constants` (not modified here). Ensure they match deployed program on devnet/mainnet before use.

---

## Typical Flows
### User
1. Connect wallet.  
2. **Stake SOL** → receives LST (DepositSOLToVault).  
3. **Unstake dSOL** → burns LST, creates withdraw request for current epoch (BurnLstToRedeemSOL).  
4. After next epoch, **Claim SOL** → ClaimSOLFromWithdrawVault.  
5. View pending request status and claim readiness in UI.

### Admin
1. Connect with admin wallet (matches `LSTManager.admin`).  
2. Periodically **Stake Vault SOL** to validator (StakeVaultSOLToValidator).  
3. For an epoch with pending withdrawals, **Unstake SOL** to create/deactivate split stake (UnstakeSOLFromValidator).  
4. Once split stake is inactive, **Withdraw to User Vault** (WithdrawFromSplitStake).  
5. Users can then claim from the withdraw vault.

---

## Deployment (program)
- Build: `cargo build-bpf` (or `cargo build-sbf` with your toolchain).  
- Deploy: `solana program deploy <path/to/so>`; update frontend constants with the new program ID and derived PDAs (using the same seeds and bumps).
- Verify PDAs (using seeds listed above) match constants used in the frontend.

---

## Notes on Exchange Rates
- Deposit mints LST using `sol_to_lst_rate(total_sol_in_protocol, total_lst_in_protocol)`.
- Unstake burns LST and records SOL owed using `lst_to_sol_rate`.
- `total_pending_withdrawl_sol` is excluded from the available SOL when computing rates for fairness.

---

## Testing Checklist
- Wallet connect works on devnet.
- Stake: 
  - SOL debits wallet, LST mints to ATA.
  - Balance validation prevents staking more than available.
  - Toast notification with Explorer link displayed.
- Unstake: 
  - LST burns, withdraw request + epoch withdraw PDAs created/updated.
  - Balance validation prevents unstaking more than available LST.
  - Toast notification with Explorer link displayed.
- Claim: 
  - Only available after requested_epoch + 1.
  - Transfers SOL from withdraw vault and marks request completed.
  - Toast notification with Explorer link displayed.
- Admin actions: 
  - Require admin pubkey.
  - Validator dropdown populates with available validators.
  - Vault balances display correctly.
  - Split stake becomes withdraw-ready before admin withdraws to user vault.
  - All admin transactions show toast notifications with Explorer links.

---

## Screenshots Demo
#### 1. User Dashboard - Overview
![User Dashboard Overview](https://github.com/akshaydhayal/Solana-LST-Manager-Program/blob/main/user_ui.png)
*Main user dashboard showing stats grid, stake/unstake tabs, and pending withdrawals card.*

#### 2. Admin Dashboard - Overview
![Admin Dashboard Overview](https://github.com/akshaydhayal/Solana-LST-Manager-Program/blob/main/admin_ui.png)
*Main admin dashboard showing stats grid, admin action tabs, and stake/split account lists.*

---

## Repository Layout
- `contract/` — Solana program (Rust, non-Anchor).  
- `frontend/` — React + Tailwind + wallet adapter UI.  
- `README.md` — This document.

