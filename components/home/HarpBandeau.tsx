import Link from 'next/link'
import Image from 'next/image'
import React from 'react'

export default function  HarpBandeau () {
  return (
    <div className="container h-45 flex gap-2 flex-col rounded-lg md:flex-row justify-center">
        

         <div className='flex-grow mx-5 mt-5'> 
                {/* <Image className="h-100 w-100 mt-0" src="/images/OPSE_logo.gif" width={300} height={50} alt="logo"  object-cover/>     */}
         </div>



        <div className='flex-grow p-5'>
            <h1 className='text-5xl font font-semibold text-orange-500 mb-5'>PORTAIL TMA HARP</h1><br />
            
            <div className="flex gap-5">
            <h2>Utilisateur</h2>
            <h2>Dernière connexion</h2>
            <h2>Compte Unix</h2>

            </div>     
            </div>

    </div>
  )
}

 