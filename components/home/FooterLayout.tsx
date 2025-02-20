"use client"

import { FaInstagram } from "react-icons/fa";
import { FaFacebookF } from "react-icons/fa6";
import { FaTiktok } from "react-icons/fa6";
import { RiTwitterXLine } from "react-icons/ri";
import { FaWhatsapp } from "react-icons/fa6";
import { FaSquareYoutube } from "react-icons/fa6";
import Link from 'next/link'
import Image from 'next/image'
import { APP_NAME } from "@/lib/constants";

export default function FooterLayout() {
    const currentYear = new Date().getFullYear();
  
  return (
      <footer className=' bg-gray-800 mx-auto text-white font-title'>
       
        <div className=' bg-purple-800 text-xl text-semibold text-center items-center justify-center'>
        <p > {currentYear} {APP_NAME}. &copy; dxc.com - Tous Droits Reservés</p>
        </div>
        
  </footer>
  )
}


   