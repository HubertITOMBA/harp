'use client'

import { useEffect, useState } from 'react'
import { psadm_srv, psadm_rolesrv } from '@prisma/client'

// Type pour les résultats de la jointure
type JoinResult = {
  srv: string
  ip: string
  pshome: string
  os: string
  psuser: string | null
  domain: string | null
  env: string
  typsrv: string
  status: number | null
}

export default function HarpPage() {
  const [serverData, setServerData] = useState<JoinResult[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchServerData()
  }, [])

  const fetchServerData = async () => {
    try {
      const response = await fetch('/api/getServerData')
      const data = await response.json()
      setServerData(data)
    } catch (err) {
      setError("Erreur lors de la récupération des données")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Données des serveurs</h1>
      
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead >
              <tr className="bg-harpOrange text-white">
                <th className="p-2 border">Serveur</th>
                <th className="p-2 border">IP</th>
                {/* <th className="p-2 border">PS Home</th>
                <th className="p-2 border">OS</th>
                <th className="p-2 border">PS User</th> */}
                <th className="p-2 border">Domaine</th>
                {/* <th className="p-2 border">Environnement</th> */}
                <th className="p-2 border">Type Serveur</th>
                <th className="p-2 border">Statut</th>
              </tr>
            </thead>
            <tbody>
              {serverData.map((item, index) => (
                <tr key={index}>
                  <td className="p-2 border">{item.srv}</td>
                  <td className="p-2 border">{item.ip}</td>
                  {/* <td className="p-2 border">{item.pshome}</td>
                  <td className="p-2 border">{item.os}</td>
                  <td className="p-2 border">{item.psuser}</td> */}
                  <td className="p-2 border">{item.domain}</td>
                  {/* <td className="p-2 border">{item.env}</td> */}
                  <td className="p-2 border">{item.typsrv}</td>
                  <td className="p-2 border">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}