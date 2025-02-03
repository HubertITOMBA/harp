"use client";

import React, { useState } from 'react'
import dynamic from 'next/dynamic';
import Image from 'next/image';
// import TeacherForm from '@/components/fmkin/forms/TeacherForm';
// import StudentForm from '@/components/fmkin/forms/StudentForm';


const EnvForm = dynamic(() => import ("@/components/forms/EnvForm"), {
   loading: () => <h1>Chargement...</h1>
});

const UserForm = dynamic(() => import("@/components/forms/UserForm"), {
   loading: () => <h1>Chargement...</h1>,
 });


const forms: {
  [key: string]: (type: "create" | "update", data?: any) => JSX.Element;
} = {
  psadm_env: (type, data) => <EnvForm type={type} data={data}/>,
  psadm_user: (type, data) => <UserForm type={type} data={data}/>
};

const FormModal = ({table, type, data, id} : {
    table: 
        | "psadm_env" 
        | "psadm_user" 
        | "psadm_tools" 
        | "psadm_srv" 
        | "psadm_ptools" 
        | "psadm_statenv";
    type: "create" | "update" | "delete";
    data?: any;
    id?: number | string ;
}) => {

  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";  
  const bgColor = 
      type === "create"
        ? "bg-blue-400"
        : type === "update"
        ? "bg-harpSky"
        : "bg-purple:300";  

  const [open, setOpen] = useState(false);

  const Form = () => {  
    return type === "delete" && id ? (
        <form action="" className="p-4 flex flex-col gap-4">
           <span>Toutes les données seront perdues. Êtes-vous sûr de vouloir supprimer ceci ? {table}</span>
           <button className="bg-red-700 text-white py-2 px-4 rounded-xl border-none w-max self-center">Supprimer</button>
        </form>        
        ) : type === "create" || type === "update" ? (
            forms[table](type, data)
        ) : (
           " Formulaire non trouvé ! "
        );
    };



  return (
    <>
     <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
      >
        <Image src={`/ressources/${type}.png`} alt="" width={16} height={16} />
      </button>
      { open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]">
            
             <Form />  
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            > 
              <Image src="/ressources/close.png" alt="" width={14} height={14} />
            </div>
           
            
          </div>
        </div>
        )}
    </>
  )
}

export default FormModal