'use client'

import { getServerData } from '@/actions/roleServer'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
//import { getServerData } from './actions/roleServer'

interface HarpPageProps {
  id: number
}


export default function HarpPage({ id }: HarpPageProps) {
  const [serverData, setServerData] = useState<any[]>([])
  //const [serverData, setServerData] = useState<any[]>([])
  const [selectedEnv, setSelectedEnv] = useState('')

  const handleSearch = async (id: number) => {
    const data = await getServerData(id)
    setServerData(data)
  }


  useEffect(() => {
    const fetchData = async () => {
      const data = await getServerData(id)
      setServerData(data)
    }
    
    fetchData()
  }, [id])





  return (
    <div className="flex flex-col">

            {/* <div className="mb-4">
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
            </div> */}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 ">
            <tr className="bg-harpOrange text-white">
              <th className="px-2 py-2 text-left text-xl font-semibold text-white">Serveur</th>
              <th className="px-2 py-2 text-left text-xl font-semibold text-white">IP</th>
              {/* <th className="px-6 py-4 text-left text-xl font-semibold text-white">PS Home</th> */}
              <th className="px-2 py-2 text-left text-xl font-semibold text-white">OS</th>
              <th className="px-2 py-2 text-left text-xl font-semibold text-white">PS User</th> 
              <th className="px-2 py-2 text-left text-xl font-semibold text-white">Domain</th>
              {/* <th className="px-6 py-4 text-left text-xl font-semibold text-white">Env</th> */}
              <th className="px-2 py-2 text-left text-xl font-semibold text-white">Type</th>
              <th className="px-2 py-2 text-left text-xl font-semibold text-white">Description</th>
              <th className="px-2 py-2 text-left text-xl font-semibold text-white">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {serverData.map((item, index) => (
              <tr key={index} className="hover:bg-harpSkyLight transition-colors duration-200">
                <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.harpserve.srv}</td>
                <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.harpserve.ip}</td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-xl text-gray-900">{item.psadm_srv.pshome}/HARP_FILES</td> */}
                <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.harpserve.os}</td>
                <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.harpserve.psuser}</td> 
                <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.harpserve.domain}</td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-xl text-gray-900">{item.env}</td> */}
                <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.typsrv}</td>
                <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">{item.psadm_typsrv.descr}</td>
                <td className="px-2 py-2 whitespace-nowrap text-xl text-gray-900">
                  {/* {item.status} */}
                   { item.status === 1 ? 
                   <Image src="/ressources/OK.png" alt="" width={20} height={20} className="items-end bg-transparent" /> : 
                   <Image src="/ressources/KO.png" alt="" width={20} height={20} className="items-end bg-transparent" />}
                </td>
              </tr>
            ))}
          </tbody>
          
        </table>
      </div>
    </div>
  )
}