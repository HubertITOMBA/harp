import prisma from "@/lib/prisma";
import TableSearch from '@/components/harp/TableSearch';
import { Card, CardContent, CardHeader, CardFooter  } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link";

const  DetailForm = async(props) => {
  
    const Details = await prisma.psadm_dispo.findMany(
        {
          //relationLoadStrategy: 'join', // or 'query'
          where: {
              env: props.env,
            },
        }
      )

  return (
    <div>
    
              {Details.map((psadm_dispo) =>(
                 <div key={psadm_dispo.env} >
                    {psadm_dispo.statenv}  
                    {new Intl.DateTimeFormat("fr-FR").format(psadm_dispo.fromdate)}      
                    {psadm_dispo.msg}
                 </div>
                 ))};
    </div>
  )
}

export default DetailForm; 