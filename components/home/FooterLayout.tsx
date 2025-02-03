"use client"

import { FaInstagram } from "react-icons/fa";
import { FaFacebookF } from "react-icons/fa6";
import { FaTiktok } from "react-icons/fa6";
import { RiTwitterXLine } from "react-icons/ri";
import { FaWhatsapp } from "react-icons/fa6";
import { FaSquareYoutube } from "react-icons/fa6";
import Link from 'next/link'
import Image from 'next/image'

export default function FooterLayout() {

  
  return (
      <footer className=' bg-gray-800 mx-auto text-white font-title'>
        <div className='mt-5 flex gap-2 p-5 flex-col rounded-lg md:flex-row text-white justify-center '>
            {/* <div className='flex-grow p-5 '>
                <h2 className='text-2xl font-semibold'> Célébrons</h2><br />
                 <p className='text-xl'>la diversité culturelle à travers le temps</p>   
                <div className='flex gap-5 mt-10'>
                 <Link href="https://www.facebook.com/profile.php?id=61555818523054"><FaFacebookF className="h-10 w-10"/> </Link>
                 <Link href="https://www.instagram.com/festivalfmk/"><FaInstagram className="h-10 w-10"/></Link>   
                 <Link href="https://www.tiktok.com/@fmk.festival"><FaTiktok className="h-10 w-10"/></Link>   
                 <Link href="https://x.com/FmkMulti"><RiTwitterXLine  className="h-10 w-10"/></Link>
                 <Link href="https://x.com/FmkMulti"><FaWhatsapp className="h-10 w-10"/></Link>
                 <Link href="https://www.youtube.com/@fmkin"><FaSquareYoutube className="h-10 w-10"/></Link>
               
                </div> 
            </div>*/}
            <div className='flex-grow p-5'> 
                     {/* <h2 className='text-3xl font-semibold'> 	&#201;V&Eacute;NEMENTS</h2><br /> */}
                     {/* <Link href="/contact"><h2 className='text-2xl font-semibold'>Contacts</h2></Link>    <br /> */}
                     {/* <Image className="h-8 w-auto" src="/logo.jpg" width={500} height={500} alt="logo" /> */}
                     <h2 className='text-xl text  text-yellow-300 italic font-semibold'><span className='text-4xl font-semibold text-blue-500'>Harp</span> <br /> La culture dans la diversité <span className='text-red-700'>!</span></h2>   
                {/* <div className="grid grid-cols-2 flex-row gap-2">
                    <div className="w-10"><FaPhone className="h-10 w-10"/></div>
                    <div><Link href="callto:+243823158844">+243 823 158 844</Link></div>
                    <div><CiMail className="h-10 w-10"/></div>
                    <div><Link href="mailto:contact@fmkin.com">contact@fmkin.com</Link></div> 
                </div>  */}
                <div className='flex gap-2 mt-10'>
                 <Link href="https://www.facebook.com/profile.php?id=61555818523054"><FaFacebookF className="h-10 w-10"/> </Link>
                 <Link href="https://www.instagram.com/festivalfmk/"><FaInstagram className="h-10 w-10"/></Link>   
                 <Link href="https://www.tiktok.com/@fmk.festival"><FaTiktok className="h-10 w-10"/></Link>   
                 <Link href="https://x.com/FmkMulti"><RiTwitterXLine  className="h-10 w-10"/></Link>
                 <Link href="https://x.com/FmkMulti"><FaWhatsapp className="h-10 w-10"/></Link>
                 <Link href="https://www.youtube.com/@fmkin"><FaSquareYoutube className="h-10 w-10"/></Link>
               
                </div>

            </div>
            
            <div className='flex-grow p-5'>
            <h2 className='text-2xl font-semibold mb-5'>Informations</h2><br />
            <Link href='/contact'
                     type='button'
                      className="bg-gray-600 rounded-3xl p-5 mb-5">
                       S'inscrire
            
                   
            </Link>
             <div className="flex gap-5">
                  <Image className="h-100 w-100 mt-10" src="/logo.jpg" width={100} height={100} alt="logo" />    
                  <Image className="h-100 w-100 mt-10" src="/images/digitalfmk.avif" width={100} height={100} alt="logo" />  
            </div>     
            </div>
         </div>
        <div className='mt-5 bg-gray-400 text-2xl text-semibold text-center items-center justify-center'>
        <p >&copy;Tous droits reservés - dxc.com</p>
        </div>
        
  </footer>
  )
}


   