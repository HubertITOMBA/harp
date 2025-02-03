import { EnvoyerMail } from "@/lib/mail0"

export async function POST() {
    const sender = {
        name: 'My App',
        address: 'no-reply@hitomba.com'
    }

    const receipients = [{
         name: 'My App',
        address: 'no-reply@hitomba.com',
    }]

    // const subject: string;
    // const message:
    try {
        const result = await EnvoyerMail({
            sender,
            receipients,
            subject: 'Bienvenu sur le Portail Harp',
            message: "Votre nouveau portail version React"
        })

        return Response.json({
            accepted: result.accepted,
        })
        
    } catch (error) {
        return Response.json({ message: "Impossible d'envoyer un message maintenant"}, { status: 500})
    }
    
}