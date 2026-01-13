import { atom } from "recoil";
import type { splitAccountsType } from "../components/AdminSplitStakeAccounts";

export let splitAccountsState=atom<splitAccountsType>({
    key:'splitAccountsState',
    default:[]
})