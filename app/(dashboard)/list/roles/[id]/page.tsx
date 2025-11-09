

import { Button } from "@/components/ui/button";
import { getHarpRoleById } from "@/lib/actions/harprole-actions";
import { notFound } from "next/navigation";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';


const HarproleDetailPage = async (props: { params: Promise<{ id: string }>; }) => {

    const { id } = await props.params;

    if (!id) {
      notFound();
    }

    const harprole = await getHarpRoleById(id);
    if (!harprole) notFound();


    return (  
        <>
           <section>
            <div className="grid grid-cols-1 md:grid-cols-5">
                 {/* Bouton retour */}
                 <div className="col-span-5 mb-4">
                   <Button asChild variant="outline" className="bg-white hover:bg-gray-50">
                     <Link href="/list/roles">
                       <ArrowLeft className="h-4 w-4 mr-2" />
                       Retour à la liste
                     </Link>
                   </Button>
                 </div>
                 {/* Images Column */}  
                 <div className="col-span-2">{/* Images Column */}</div>
                 {/* Details Column */}
                 <div className="col-span-2 p-5">
                    <div className="flex flex-col gap-6"> 
                
                  <h1 className="h3-bold"> {harprole.role}</h1>
                  <p>{harprole.descr} </p>
                  
           </div>
           </div>
            </div>
            {/* Bouton retour en bas */}
            <div className="mt-6 flex justify-start">
              <Button asChild variant="outline" className="bg-white hover:bg-gray-50">
                <Link href="/list/roles">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la liste
                </Link>
              </Button>
            </div>
           </section>
        </>
    );
}
 
export default HarproleDetailPage;