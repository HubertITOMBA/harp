import { exec } from 'child_process';
import type { NextApiRequest, NextApiResponse } from 'next';



export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    exec('"C:\\Program Files\\PuTTY\\putty.exe"', (error) => {
      if (error) {
        console.error('Erreur lors du lancement de FileZilla:', error);
        return res.status(500).json({ error: 'Erreur lors du lancement de FileZilla' });
      }
      return res.status(200).json({ message: 'FileZilla lancé avec succès' });
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
