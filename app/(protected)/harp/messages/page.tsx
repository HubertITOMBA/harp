import React from 'react'
import { columns, User } from './columns'
import { db } from "@/lib/db";
import { DataTable } from '@/components/data-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Bell } from 'lucide-react';

// Forcer le mode dynamique pour éviter le prerender (qui cause l'erreur SSL)
export const dynamic = 'force-dynamic'

async function getUsers(): Promise<User[]> {
  try {
    // Timeout de 5 secondes pour éviter les blocages en production
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(
      'https://64a6f5fc096b3f0fcc80e3fa.mockapi.io/api/users',
      {
        cache: 'no-store', // Forcer le fetch à chaque requête
        signal: controller.signal,
      }
    )
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    
    const data = await res.json()
    return data
  } catch (error) {
    // Gérer les erreurs de timeout et de connexion gracieusement
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('Timeout lors de la récupération des utilisateurs (API externe non accessible)')
      } else if (error.message.includes('ERR_CONNECTION_TIMED_OUT') || error.message.includes('ETIMEDOUT')) {
        console.warn('Connexion timeout - API externe non accessible depuis ce réseau')
      } else {
        console.error('Erreur lors de la récupération des utilisateurs:', error.message)
      }
    } else {
      console.error('Erreur lors de la récupération des utilisateurs:', error)
    }
    // Retourner un tableau vide en cas d'erreur pour ne pas bloquer l'application
    return []
  }
}


export default async function MessagePage () {

  const data = await getUsers()

  const DescEnvts = await db.harpevent.findMany(
    {
       orderBy: [
        // harprelease: "desc",
        // typenvid: "desc",
        {
          deliveryat: "asc",
        },
        // { env: "asc",}
      ],
      take: 2   
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Messages et <span className="text-orange-600">Notifications</span>
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Consultez tous les messages et notifications du système
          </p>
        </div>

        {/* Carte principale */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Tous les messages</CardTitle>
                <CardDescription className="text-gray-300">
                  {data.length} message(s) disponible(s)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <DataTable columns={columns} data={data} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
