'use client'

import { useState } from 'react'

export default function LaunchPuttyButton({ 
  launchPutty 
}: { 
  launchPutty: () => Promise<string> 
}) {
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    try {
      setError(null)
      await launchPutty()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Lancer PuTTY
      </button>
      {error && (
        <p className="mt-4 text-red-500">{error}</p>
      )}
    </>
  )
}