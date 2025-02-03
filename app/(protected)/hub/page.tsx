'use client'

import { launchPuttyServer } from '@/actions/execPutty'
import { useState } from 'react'
//import { launchPuttyServer } from './actions'

export default function HarpPage() {
  const [error, setError] = useState<string | null>(null)

  const handleLaunchPutty = async () => {
    setError(null)
    const result = await launchPuttyServer()
    if (!result.success && result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Lancement de PuTTY</h1>
      <button
        onClick={handleLaunchPutty}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Lancer PuTTY
      </button>
      {error && (
        <p className="mt-4 text-red-500">{error}</p>
      )}
    </div>
  )
}
