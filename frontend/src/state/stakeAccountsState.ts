import { atom } from "recoil";
import type { stakeAccountsType } from "../components/AdminStakeAccounts";

export let stakeAccountsState=atom<stakeAccountsType>({
    key:'stakeAccountsState',
    default:[]
})