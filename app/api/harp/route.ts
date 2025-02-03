import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import path from 'path';




export default function handlePutty(req: NextApiRequest, res: NextApiResponse) {

    if (req.method === 'POST') {
      // const puttyPath = "C:\\Program Files\\PuTTY\\putty.exe";

      const puttyPath = path.join('C:', 'Program Files', 'PuTTY', 'putty.exe')

      exec("C:\\Program Files\\PuTTY\\putty.exe", (error, stdout, stderr) => {

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
        
  }
  