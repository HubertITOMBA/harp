
import Annonces from "@/components/harp/Annonces";
import EnvCard from "@/components/harp/EnvCard";
import EventCalendar from "@/components/harp/EventCalendar";
import VolumetrieChart from "@/components/harp/VolumetrieChart";
import Link from "next/link";
// import { spawn } from "child_process";




export default async function AdminPage(){


     



   // const session = await auth();

   // Executer un ping  
//    const command = spawn('ping', ["google.com"])
//    command.stdout.on('data', output => {
//    console.log("Output: ", output.toString())
//    })

    

    return ( 
        <div className="p-4 flex gap-4 flex-col md:flex-row">
            {/* {JSON.stringify(session)} */}

            {/** GAUCHE */ }
            <div className="w-full lg:w-2/3 flex flex-col gap-8">
                <div className="flex gap-4 justify-between flex-wrap">
                    <EnvCard type="Devops"/>
                    <EnvCard type="HotFix"/>
                    <EnvCard type="Qualif"/>
                    <EnvCard type="Recette"/>
                </div>
                {/**MIDDLE**/}
                <div className="flex gap-4 flex-col lg:flex-row">
                   
                     {/**ADMINISTRATION DU PORTAIL**/}
                    <div className="w-full lg:w-1/3 h-[450px]">
                        <VolumetrieChart />
                    </div>
                     {/**ATTENDANCE CHART**/}
                    <div className="w-full lg:w-2/3 h-[450px]">
                    Autres graphiques
                        {/* <AttendanceChart /> */}
                    </div>
                </div>
                {/**BOTTOM  CHART**/}
                <div className="w-full h-[500px]">
                    {/* <FinanceChart /> */}
                </div>
             
                {/* <form action={async () => {
                    "use server";

                    await signOut();
                 }}>


                 <Link
                   href="javascript:execPUTTY(`-ssh hubert@192.168.1.49 -i 'C:\\ssh\hitomba.ppk`)" 
                  >
                    LAncer Putty
                  </Link>

                     <button type="submit">
                        Deconnexion
               </button>
  
                 </form> */}

                 
<Link
                   href="javascript:execPUTTY(`-ssh hubert@192.168.1.49 -i 'C:\\ssh\hitomba.ppk`)" 
                  >
                    LANCER L'OMPORTATION
                  </Link>



            </div>


             {/** DROITE  */ }
             <div className="w-full lg:w-1/3 flex flex-col gap-8">
                {/* <EventCalendar />  */}
              
                <Annonces /> 
             </div>
        </div>
    )
}