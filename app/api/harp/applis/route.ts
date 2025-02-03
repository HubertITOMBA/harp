import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';


// export default function handlePutty(req: NextApiRequest, res: NextApiResponse) {
  export async function POST(request: Request) {
    const data = await request.json()

  if (req.method === 'POST') {
   
    // const puttyPath = "C:\\Program Files\\PuTTY\\putty.exe";

    const puttyPath = path.join('C:', 'Program Files', 'PuTTY', 'putty.exe');
    console.log("CHEMIN DE PUTTY ======", puttyPath);
    

    exec(`"${puttyPath}"`, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ message: `Erreur : ${error.message}` });
      }
      if (stderr) {
        return res.status(500).json({ message: `Erreur : ${stderr}` });
      }
      res.status(200).json({ message: 'Putty a été lancé avec succès' });
    });



  } else {
    res.status(405).json({ message: 'Méthode non autorisée' });
  }


  return NextResponse.json({
    data,
  });


}



export async function GET() {
  return NextResponse.json({
    hello: "Le monde !",
  });

}
