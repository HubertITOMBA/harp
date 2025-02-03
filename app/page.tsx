
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"    
import { LoginButton } from "@/components/auth/login-button"
import { migratePsUserData, migrateUserRoles, migrerUserRoles, syncUserRoles } from "@/actions/importOra"


    
export default function Home() {
  return (
    <main className="flex h-full flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-white via-white to-purple-700">
        <div className="space-y-6 text-center">
          <div className="px-5 pt-2 flex gap-4 items-center justify-center">
                <h1 className="text-6xl font-semibold text-black text-lgexit sm:text-6xl md:text-6xl text-center justify-center"> 
                <span className={cn("block font-semibold text-red-500 xl:inline animate-pulse")}>Portail</span><br />  
                    <span className={cn("text-6xl font-semibold text-red-600 drop-shadow-md")}>TMA HARP</span> <br />  
                <span 
                    className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-900 via-orange-400 to-red-900 animate-pulse"
                >
                    Human Ressource 
                </span>
                </h1> 
                 
                   {/* <div  className="h-5 w-5 relative flex"> 
                    <span className="animate-ping absolute h-full w-full bg-red-500 rounded-full"></span>
                    <span className="bg-red-500 h-arpOranfull w-full rounded-full inline-flex"></span>  
                    </div> */}
                   
           </div>
           <div>
             <LoginButton>
                <Button variant="default" size="lg" className="w-full text-white font-semibold bg-blue-700 rounded-xl shadow-2xl">
                    Se connecter
                </Button> 
            </LoginButton>
 
              {/* <form action={migrerUserRoles}> 
                  <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-5">
                    Migrer les données PSADM
                  </button> 
              </form>*/}
             
           </div>
        </div>
    </main>
  );
};
