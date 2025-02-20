

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getHarpRoleById } from "@/lib/actions/harprole-actions";
import { notFound } from "next/navigation";


const HarproleDetailPage = async (props: { params: Promise<{ id: string }>; }) => {

    const { id } = await props.params;

    const harprole = await getHarpRoleById(id);
    if (!harprole) notFound();


    return (  
        <>
           <section>
            <div className="grid grid-cols-1 md:grid-cols-5">
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
           </section>
        </>
    );
}
 
export default HarproleDetailPage;