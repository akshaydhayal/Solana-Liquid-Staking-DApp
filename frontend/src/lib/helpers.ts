import { lstManagerPda, lstManagerVaultPda, lstMintPda, PROGRAM_ID, stakeRegistryRecordPda } from "./constants";
import * as borsh from "borsh";
import { lstManagerPdaSchema, StakeRegistryRecordSchema, UserWithdrawRequestPdaSchema, valueToU64Schema } from "./borshSchema";
import * as spl from "@solana/spl-token";
import { PublicKey, type Connection } from "@solana/web3.js";
import { Buffer } from "buffer";

export async function getProtocolStats(connection:Connection){    
    let lstManagerVaultPdaBal=await connection.getBalance(lstManagerVaultPda,"confirmed") - await connection.getMinimumBalanceForRentExemption(0,"confirmed");    
    let lstManagerPdaData=await connection.getAccountInfo(lstManagerPda,"confirmed");
    if(!lstManagerPdaData){return;}
    let deserialisedLstManagerPdaData=borsh.deserialize(lstManagerPdaSchema,lstManagerPdaData?.data);

    if(!deserialisedLstManagerPdaData){return;}
    //@ts-ignore
    // let protocolTVL:number=lstManagerVaultPdaBal + Number(deserialisedLstManagerPdaData.total_sol_staked);
    // return {protocolTVL,protocolActivePendingWithdrawls};
    
    //@ts-ignore
    let protocolTVL:number=lstManagerVaultPdaBal + Number(deserialisedLstManagerPdaData.total_sol_staked) - Number(deserialisedLstManagerPdaData.total_pending_withdrawl_sol);
    //@ts-ignore
    let protocolActivePendingWithdrawls:number= Number(deserialisedLstManagerPdaData.total_pending_withdrawl_sol);
    //@ts-ignore
    let protocolActiveStaked:number= Number(deserialisedLstManagerPdaData.total_sol_staked);
    return {protocolTVL, protocolActivePendingWithdrawls, protocolActiveStaked};
}

export async function getLSTMintSupply(connection:Connection){
    let lstMintData=await spl.getMint(connection,lstMintPda,"confirmed",spl.TOKEN_PROGRAM_ID);
    let lstSupply=Number(lstMintData.supply) / (Math.pow(10,lstMintData.decimals));
    return lstSupply;
}

export async function getUserWithdrawRequest(user:PublicKey, connection:Connection){
    let [userWithdrawPda, ]=PublicKey.findProgramAddressSync([Buffer.from("user_withdraw_request"), user.toBuffer()], PROGRAM_ID);
    let userWithdrawPdaData=await connection.getAccountInfo(userWithdrawPda,"confirmed");
    if(!userWithdrawPdaData){return;}
    let deserialisedUserWithdrawPdaData=borsh.deserialize(UserWithdrawRequestPdaSchema,userWithdrawPdaData?.data);
    return deserialisedUserWithdrawPdaData;
}

export async function fetchAllWithdrawRequest(connection:Connection){
    console.log("fetch all withdraw requests");
    let user1=new PublicKey("3shLPzr2Dd4d8XShBMrcUnUUoRTf1iEmDDaTXLiBLAC3");
    let [user1WithdrawPda,]=PublicKey.findProgramAddressSync([Buffer.from("user_withdraw_request"), user1.toBuffer()], PROGRAM_ID);
    let user1WithdrawPdaData=await connection.getAccountInfo(user1WithdrawPda,"confirmed");
    if(!user1WithdrawPdaData){return;}
    let deserialisedUser1WithdrawPdaData=borsh.deserialize(UserWithdrawRequestPdaSchema,user1WithdrawPdaData.data);
    console.log("deserialisedUser1WithdrawPdaData : ",deserialisedUser1WithdrawPdaData)
        
    let user2=new PublicKey("BWkUkMnQB449fXF8JVnHTejsbcDrL2i11ut876q1t6w");
    let [user2WithdrawPda,]=PublicKey.findProgramAddressSync([Buffer.from("user_withdraw_request"), user2.toBuffer()], PROGRAM_ID);
    console.log("user2WithdrawPda : ",user2WithdrawPda.toBase58());
}

export async function checkIfUserIsAdmin(connection:Connection, user:PublicKey){
    let lstManagerPdaData=await connection.getAccountInfo(lstManagerPda,"confirmed");
    if(!lstManagerPdaData){return;}
    let deserialisedLstManagerPdaData=borsh.deserialize(lstManagerPdaSchema,lstManagerPdaData?.data);

    //@ts-ignore
    let adminPub=new PublicKey(deserialisedLstManagerPdaData?.admin);
    let isUserAdmin=(adminPub.toBase58()==user.toBase58());
    console.log("adminPub : ",adminPub.toBase58());
    console.log("status : ",adminPub.toBase58()==user.toBase58());
    return isUserAdmin;
}

export async function getNextStakePdaAccount(connection:Connection){
    let stakeRegistryPdaData=await connection.getAccountInfo(stakeRegistryRecordPda);
    if(!stakeRegistryPdaData){return;}
    let deserialisedStakeRegistryPdaData=borsh.deserialize(StakeRegistryRecordSchema, stakeRegistryPdaData?.data);
    
    //@ts-ignore
    let nextStakeIndex=Number(deserialisedStakeRegistryPdaData?.next_stake_index);    
    let serialisedNextStakeIndex=borsh.serialize(valueToU64Schema, {value:nextStakeIndex});    
    console.log("nextStakeIndex : ",nextStakeIndex);

    let [nextStakeAccPda,nextStakeAccBump]=PublicKey.findProgramAddressSync([Buffer.from("stake_acc"), Buffer.from(serialisedNextStakeIndex), lstManagerPda.toBuffer()], PROGRAM_ID)
    return {nextStakeAccPda , nextStakeAccBump};
} 

export async function getNextSplitPdaAccount(connection:Connection){
    let stakeRegistryPdaData=await connection.getAccountInfo(stakeRegistryRecordPda);
    if(!stakeRegistryPdaData){return;}
    let deserialisedStakeRegistryPdaData=borsh.deserialize(StakeRegistryRecordSchema, stakeRegistryPdaData?.data);
        
    //@ts-ignore
    let nextSplitIndex=Number(deserialisedStakeRegistryPdaData?.next_split_index);    
    let serialisedNextSplitIndex=borsh.serialize(valueToU64Schema, {value:nextSplitIndex});    
    console.log("nextSplitIndex : ",nextSplitIndex);

    let [nextSplitAccPda,nextSplitAccBump]=PublicKey.findProgramAddressSync([Buffer.from("split_stake_acc"), Buffer.from(serialisedNextSplitIndex), lstManagerPda.toBuffer()], PROGRAM_ID)
    return {nextSplitAccPda , nextSplitAccBump};
} 