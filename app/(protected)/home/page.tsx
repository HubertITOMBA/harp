import Image from "next/image";
import { auth, signOut } from "@/auth"
// mport prisma from "@/lib/prisma"; 
import HarpEventPage from "@/components/harp/HarpEvents";
import migratePsadmData, { migrateEnvsData, migrateMenuDashData, migrateMenusData, migratePsUserData } from "@/actions/importOra";



// async function migratePsadmData() {
//   "use server";
  
//   try {
//     const { prisma } = await import('@/lib/prisma');
    
//     // Récupérer les données de psadm_oracle
//     const psadmData = await prisma.psadm_oracle.findMany();
    
//     // Insérer les données dans harpora
//     await prisma.harpora.createMany({
//       data: psadmData.map(record => ({
//         id: crypto.randomUUID(),
//         oracle_sid: record.oracle_sid,
//         aliasql: record.aliasql,




//     });
    
//     return { success: true, message: 'Migration réussie' };
//   } catch (error) {
//     console.error('Erreur lors de la migration:', error);
//     return { success: false, message: 'Erreur lors de la migration' };
//   }migrateUserRoles
// }




export default async function Home() {
  //const session = await auth();
  return (
    <>
        {/* {JSON.stringify(session)}
        <form action={async () => {
            "use server";
             await signOut();
          }}>
               </button>
         </form> 
         */}
        

      <HarpEventPage />


    </>
 
  );
}
