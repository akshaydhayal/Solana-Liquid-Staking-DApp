import { useConnection } from '@solana/wallet-adapter-react'
import  { useEffect, useState } from 'react'
import { useRecoilValue } from 'recoil';
import { navState } from '../state/navState';
import { checkIfUserIsAdmin } from '../lib/helpers';
import UserPage from './UserPage';
import AdminPage from './AdminPage';

const AppGate = () => {
  let {connection}=useConnection();
  let userAddress=useRecoilValue(navState);
  const [isUserAdmin, setIsUserAdmin]=useState(false);

  useEffect(()=>{
      async function checkIsUserAdmin(){
          if(userAddress.user_address){
              let userAdminStatus=await checkIfUserIsAdmin(connection, userAddress.user_address);
              if(userAdminStatus!=null){
                setIsUserAdmin(userAdminStatus);  
              }
          }
      }
      checkIsUserAdmin();
  },[connection, userAddress])
  // },[])
  
  return (
    <div>
        {isUserAdmin==true? <AdminPage/> : <UserPage/>}
    </div>
  )
}

export default AppGate