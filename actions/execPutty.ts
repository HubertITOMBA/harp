'use server'

import { exec } from 'child_process'

export async function launchPuttyServer(): Promise<{ success: boolean, error?: string }> {
  const puttyPath = "C:\\Program Files\\PuTTY\\putty.exe"
  
  try {
    return new Promise((resolve) => {
      exec(`"${puttyPath}"`, (error) => {
        if (error) {
          console.error(`Erreur lors du lancement de PuTTY: ${error}`)
          resolve({ success: false, error: `Impossible de lancer PuTTY: ${error.message}` })
          return
        }
        resolve({ success: true })
      })
    })
  } catch (err) {
    return { success: false, error: 'PuTTY n\'a pas pu être lancé. Veuillez vérifier son installation.' }
  }
}