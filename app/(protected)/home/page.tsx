 "use client"; 

// import Image from "next/image";
// import { auth, signOut } from "@/auth"
// mport prisma from "@/lib/prisma"; 
import { Session } from "next-auth";
// import { SessionProvider, signOut } from "next-auth/react";
// import { useSession, signOut } from "next-auth/react";

import HarpEventPage from "@/components/harp/HarpEvents";
import { logOut } from "@/actions/logout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCurrentRole } from "@/hooks/use-current-role";

// import { getUserRoles } from "@/actions/menurigth";

// export const metadata = {
//   title: 'Accueil',
// }

 const Home = () => {
  const user = useCurrentUser();
  const roles = useCurrentRole();

   // const currentUser = session?.user?.id;
   // const userRoles = await getUserRoles(parseInt(currentUser));
  
   const onClick = () => {
     logOut();
   }

  return (
    <>
        {/* {JSON.stringify(session)}
        <form action={async () => {
            "use server";
             await signOut();
          }}>
               </button>
 
       PUM", "DMOSTD", "POC92", "TMA_LOCAL", "REF", "DRP", "HUBERT", "AXEL", "NICOLAS"
         </form> 
         */}
        
        {JSON.stringify(user)}
         <p>
         
          mes roles:  {roles}
         </p>
        <button onClick ={onClick} type="submit"> 
                Déconnexion
         </button>


         {/* <p>
         {session?.user?.id}
         {userRoles}
      </p> */}
        {/* <form action={async () => {
            "use server";
            await signOut();
          }}
          > 
            
          </form> */}

      {/* <HarpEventPage /> */}


    </>
 
  );
};

export default Home;
