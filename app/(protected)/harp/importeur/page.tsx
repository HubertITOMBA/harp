"use client"
import { NextApiRequest, NextApiResponse } from 'next';
import { useState } from 'react';
import { PrismaClient } from '@prisma/client';
import { db } from "@/lib/db";



const prisma = new PrismaClient();

const ImportPage = () => {
    const [isImporting, setIsImporting] = useState(false);
    const [message, setMessage] = useState<string>('');

    const importUserRoles = async () => {
        try {
            setIsImporting(true);
            setMessage('Importation en cours...');

            const results = await db.User.findMany({
                select: {
                    id: true,
                },
                where: {
                    netid: {
                        in: await db.psadm_user.findMany({
                            select: { netid: true },
                            where: {
                                psadm_roleuser: {
                                    some: {
                                        role: {
                                            in: await db.harproles.findMany({
                                                select: { role: true }
                                            }).then(roles => roles.map(r => r.role))
                                        }
                                    }
                                }
                            }
                        }).then(users => users.map(u => u.netid))
                    }
                }
            });

            for (const user of results) {
                const roles = await db.harproles.findMany({
                    where: {
                        role: {
                            in: await db.psadm_roleuser.findMany({
                                where: {
                                    netid: user.netid
                                },
                                select: { role: true }
                            }).then(roles => roles.map(r => r.role))
                        }
                    }
                });

                for (const role of roles) {
                    await db.harpuseroles.create({
                        data: {
                            userId: user.id,
                            roleId: role.id
                        }
                    });
                }
            }

            setMessage('Import terminé avec succès!');
        } catch (error) {db
            console.error('Erreur lors de l\'import:', error);
            setMessage('Erreur lors de l\'import. Consultez la console pour plus de détails.');
        } finally {
            setIsImporting(false);
            await db.$disconnect();
        }
    };

  return (
    <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Importation des rôles utilisateurs</h1>
    
    <button 
        onClick={importUserRoles}
        disabled={isImporting}
        className={`px-4 py-2 rounded ${
            isImporting 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
    >
        {isImporting ? 'Importation en cours...' : 'Démarrer l\'importation'}
    </button>

    {message && (
        <p className="mt-4">{message}</p>
    )}
</div>
  )
}

export default ImportPage