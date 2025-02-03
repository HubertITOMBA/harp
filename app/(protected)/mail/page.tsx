import EnvoiMail from '@/components/harp/EnvoiMail'
import { Button } from '@/components/ui/button'
import { sendMail } from '@/lib/mail'
import React from 'react'

const page = () => {


  const send = async()=>{
    "use server"
    await sendMail({
        to: "hubert.itomba@orange.fr",
        name: "Hubert",
        subject: "TEST",
        body: `
            <h1>Bonjour HARP ! </h1> 
        `
    })
  }

  return (
    <div className='flex min-h-screen flex-col items-center justify-center p-24 gap-4'>
        {/* <EnvoiMail /> */}
        <form>

        <Button formAction={send}
            className="bg-blue-500 rounded p-3 text-white"
        >
            Envoyer mail    
        </Button>

        </form>

    </div>
  )
}

export default page