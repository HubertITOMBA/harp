
import Annonces from "@/components/harp/Annonces";
import EnvCard from "@/components/harp/EnvCard";
import EventCalendar from "@/components/harp/EventCalendar";
import VolumetrieChart from "@/components/harp/VolumetrieChart";
import { getAdminSummary } from "@/lib/actions/admin-acions";
import Link from "next/link";
import { auth } from '@/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseIcon, ServerIcon, Users } from "lucide-react";
// import { spawn } from "child_process";




export default async function AdminPage(){

  const session = await auth();

//   if (session?.user?.role !== 'PSADMIN') {
//     throw new Error('Utilisateur non authorisé !');
//   }


   // Executer un ping  
//    const command = spawn('ping', ["google.com"])
//    command.stdout.on('data', output => {
//    console.log("Output: ", output.toString())
//    })

const summary = await  getAdminSummary();

// console.log("LES SOMMES DE PUIS ADMIN PAGE ==>> ", summary );

    return ( 
        <div className="p-4 flex gap-4 flex-col md:flex-row">
             {/* <h1 className='h2-bold'>Dashboard</h1>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Utilisateurs</CardTitle>
                        <Users />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                        {summary.usersCount}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Serveurs</CardTitle>
                        <ServerIcon />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                        {summary.serverCount}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Environnements</CardTitle>
                        <DatabaseIcon />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                        {summary.envsCount}
                        </div>
                </CardContent>
                </Card>
            </div> */}
        
 
            {/* {JSON.stringify(session)} */}

            {/** GAUCHE */ }
            <div className="w-full lg:w-2/3 flex flex-col gap-8">
            <h1 className='h2-bold'>Dashboard</h1>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                
                <Card className="bg-violet-300">
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Utilisateurs</CardTitle>
                        <Users />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                        {summary.usersCount}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-300">
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Serveurs</CardTitle>
                        <ServerIcon />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                        {summary.serverCount}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-orange-300">
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Environnements</CardTitle>
                        <DatabaseIcon />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                        {summary.envsCount}
                        </div>
                </CardContent>
                </Card>
            </div>


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