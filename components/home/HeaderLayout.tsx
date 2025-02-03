"use client"
import { useState } from 'react'
// import { Dialog, DialogPanel } from '@headlessui/react'
// import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
// import { Dialog } from '../ui/dialog'
//import { LoginButton } from '../auth/login-button'

const navigation = [
  // { name: "Environnements", href: '/' },
  { name: "Self-service", href: '/program' },
  { name: "Recherche", href: '/galery' },
  { name: 'Statacm', href: '/agenda' },
  { name: 'Base de connaissances', href: '/fitness' },
  { name: 'Administration Portail', href: '/padmin' },
  { name: 'Aide', href: '/contact' },
  { name: 'Mot de passe', href: '/contact' },
  { name: 'Déconnexion', href: '/contact' },
]

export default function HeaderLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
 
    <header className='
            container
             flex flex-row
            justify-between 
            items-center 
            backdrop-blur-lg 
            sticky 
            top-0 z-[999]
            w-auto
            '> 
          
          <div className='flex flex-col'>
            
            <div className='h-2 w-full p-3 bg-orange-500'>
            </div >
            <div >
                  <nav className="mx-auto flex max-w-7xl items-center justify-between p-1 lg:px-4">
                      <div className="flex items-center justify-between font-medium gap-5">
                            {navigation.map((item) => (
                              <Link 
                                  key={item.name} 
                                  href={item.href} 
                                  className="capitalize link gap-5">
                                {item.name}
                              </Link>
                            ))}
                      </div>
                      <div className="hidden lg:flex lg:justify-end">
                        <Link href="/auth/sign-in" className="text-sm font-semibold leading-4 px-4 py-1">
                          Se connecter <span aria-hidden="true">&rarr;</span>
                        </Link>
                      </div>
                  </nav>
              </div>
          </div>
    </header>
   
  )
}