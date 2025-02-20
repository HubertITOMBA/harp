
// import { getUserRoles } from "@/actions/menurigth";
// import { useSession } from "next-auth/react";

// export const useCurrentRole = () => {
//   const session = useSession();

//    const currentUser = session.data?.user?.id;
//    const userRoles =  getUserRoles(parseInt(currentUser));

  
//   return userRoles;
// };

import { getUserRoles } from "@/actions/menurigth";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export const useCurrentRole = () => {
  const session = useSession();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  

  useEffect(() => {
    const fetchRoles = async () => {
      const currentUser = session.data?.user?.id;
      if (currentUser) {
        const roles = await getUserRoles(parseInt(currentUser));
        setUserRoles(roles);
      }
    };

    fetchRoles();
  }, [session.data?.user?.id]);
  
  

  return userRoles;
};

