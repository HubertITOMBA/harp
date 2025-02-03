'use client'

import { getServerData } from '@/actions/roleServer'
import { useEffect, useState } from 'react'
import { HarpWrapper } from '../forms/Harp-Wrapper'
//import { getServerData } from './actions/roleServer'

export default function HarpPage() {
  const [serverData, setServerData] = useState<any[]>([])
  const [selectedEnv, setSelectedEnv] = useState('')

  const handleSearch = async (env: string) => {
    const data = await getServerData(env)
    setServerData(data)
  }

  return (
    <HarpWrapper
            labelBox= "Connexion"
            headerLabel="Content de vous revoir !"
            backButtonLabel="Vous n'avez pas encore de compte ?"
            backButtonHref="/auth/sign-up"
        >
          
       
    <div className="flex flex-col p-4">
      <div className="mb-4">
        <input
          type="text"
          value={selectedEnv}
          onChange={(e) => setSelectedEnv(e.target.value)}
          placeholder="Entrez l'environnement"
          className="border p-2 rounded"
        />
        <button
          onClick={() => handleSearch(selectedEnv)}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Rechercher
        </button>
      </div>

      <div className="overflow-x-auto">
     
        <table className="h-96 min-w-full border-collapse border">
          <thead>
            <tr className="bg-harpOrange text-white">
              <th className="border p-2">Serveur</th>
              <th className="border p-2">IP</th>
              <th className="border p-2">PS Home</th>
              {/* <th className="border p-2">OS</th>
              <th className="border p-2">PS User</th> */}
              <th className="border p-2">Domain</th>
              {/* <th className="border p-2">Env</th> */}
              <th className="border p-2">Type Serveur</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {serverData.map((item, index) => (
              <tr key={index}>
                <td className="border p-2 text-black">{item.psadm_srv.srv}</td>
                <td className="border p-2">{item.psadm_srv.ip}</td>
                <td className="border p-2">{item.psadm_srv.pshome}</td>
                {/* <td className="border p-2">{item.psadm_srv.os}</td>
                <td className="border p-2">{item.psadm_srv.psuser}</td> */}
                <td className="border p-2">{item.psadm_srv.domain}</td>
                {/* <td className="border p-2">{item.env}</td> */}
                <td className="border p-2">{item.typsrv}</td>
                <td className="border p-2">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </HarpWrapper> 
  )
}