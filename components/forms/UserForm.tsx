"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react'
import { useForm } from 'react-hook-form';
import { z } from "zod"
import InputField from '@/components/harp/InputField';
import Image from 'next/image';
import { UserSchema } from '@/schemas';


type Inputs = z.infer<typeof UserSchema>;

const UserForm = ({
        type,
        data,
       }: {
        type: "create" | "update";
        data?: any;
      }
) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Inputs>({ resolver: zodResolver(UserSchema),
    });

  const onSubmit = handleSubmit(data => {
    console.log(data);
    
  })   

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <h1 className="text-xl font-semibold">Créer un nouvel utilisateur</h1>
        <span className="text-xs text-gray-400 font-medium">Information d&apos;authentification</span>
        <div className="flex justify-between flex-wrap gap-4">
           <InputField 
                label="Ordre"
                register={register}
                name="ordre"
                defaultValue={data?.display}
                error={errors?.display}
            />
           <InputField 
                label="Environnement"
                register={register}
                name="Environnement"
                defaultValue={data?.env}
                error={errors?.env}
            />
            <InputField 
                label="Site PS"
                register={register}
                name="site"
                defaultValue={data?.site}
                error={errors?.site}
            />
            <InputField 
                label="Type Environnement"
                register={register}
                name="typenv"
                defaultValue={data?.typenv}
                error={errors?.typenv}
            />
            </div>
            <div className="flex flex-col gap-2 w-full md:w-1/4">
            <InputField 
                label="URL"
                register={register}
                name="url"
                defaultValue={data?.url}
                error={errors?.url}
             />
              <label className="text-xs text-gray-500">Anonymisation</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("anonym")}
                defaultValue={data?.sex}
              >
                <option value="O">Oui</option>
                <option value="N">Non</option>
              </select>
              {errors.anonym?.message && (
                <p className="text-xs text-red-400">
                  {errors.anonym.message.toString()}
                </p>
              )}
          {/* </div>
            <div > */}
            
          </div>  
        <span className="text-xs text-gray-500 font-medium">Information ORACLE</span>
        <div className="flex justify-between flex-wrap gap-4">
            <InputField
                  label="Instance Oracle"
                  name="oracle_sid"
                  defaultValue={data?.oracle_sid}
                  register={register}
                  error={errors.oracle_sid}
            />
            <InputField
                  label="Alias SQL"
                  name="surname"
                  defaultValue={data?.aliasql}
                  register={register}
                  error={errors.aliasql}
            />
            <InputField
                  label="Schema"
                  name="oraschema"
                  defaultValue={data?.oraschema}
                  register={register}
                  error={errors.oraschema}
            />
            <InputField
                  label="Application"
                  name="appli"
                  defaultValue={data?.appli}
                  register={register}
                  error={errors.appli}
            />
            <InputField
                  label="PeopleSoft"
                  name="psversion"
                  defaultValue={data?.psversion}
                  register={register}
                  error={errors.psversion}
            />  
             <InputField
                  label="PeopleTools"
                  name="ptversion"
                  defaultValue={data?.ptversion}
                  register={register}
                  error={errors.ptversion}
            /> 
            <InputField
                  label="Realease"
                  name="harprelease"
                  defaultValue={data?.harprelease}
                  register={register}
                  error={errors.harprelease}
            /> 
            <InputField
                  label="Volumetrie"
                  name="volum"
                  defaultValue={data?.volum}
                  register={register}
                  error={errors.volum}
            /> 
             <InputField
                  label="Anonymisation"
                  name="anonym"
                  defaultValue={data?.anonym}
                  register={register}
                  error={errors.anonym}
            />    
             <InputField
                  label="GassiT"
                  name="gassi"
                  defaultValue={data?.gassi}
                  register={register}
                  error={errors.gassi}
            />    
             <InputField
                  label="Reverse Proxy FT"
                  name="rpg"
                  defaultValue={data?.rpg}
                  register={register}
                  error={errors.rpg}
            /> 
             <InputField
                  label="Message"
                  name="msg"
                  defaultValue={data?.msg}
                  register={register}
                  error={errors.msg}
            />    
             <InputField
                  label="Description"
                  name="descr"
                  defaultValue={data?.descr}
                  register={register}
                  error={errors.descr}
            /> 
       
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Anonymisation</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("anonym")}
            defaultValue={data?.sex}
          >
            <option value="O">Oui</option>
            <option value="N">Non</option>
          </select>
          {errors.anonym?.message && (
            <p className="text-xs text-red-400">
              {errors.anonym.message.toString()}
            </p>
          )}
        </div>

        {/* <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer" htmlFor="img">
            <Image src="/ressources/upload.png" alt="" width={28} height={28} />
            <span>Télécharger une photo</span>
          </label>
          <input type="file" id="img" {...register("img")} className="hidden"/>
            {errors.img?.message && (
                <p className="text-xs text-red-400">
                {errors.img.message.toString()}
                </p>
            )}
        </div> */}


      {/*
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Subjects</label>
          <select
            multiple
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("subjects")}
            defaultValue={data?.subjects}
          >
            {subjects.map((subject: { id: number; name: string }) => (
              <option value={subject.id} key={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjects?.message && (
            <p className="text-xs text-red-400">
              {errors.subjects.message.toString()}
            </p>
          )}
        </div>
        <CldUploadWidget
          uploadPreset="school"
          onSuccess={(result, { widget }) => {
            setImg(result.info);
            widget.close();
          }}
        >
          {({ open }) => {
            return (
              <div
                className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer"
                onClick={() => open()}
              >
                <Image src="/upload.png" alt="" width={28} height={28} />
                <span>Upload a photo</span>
              </div>
            );
          }}
        </CldUploadWidget> */}
      </div>
        <button className="bg-blue-500 text-white p-2 rounded-md">{type==="create" ? "Créer" : "Mettre à Jour"}</button>
    </form>
  )
}

export default UserForm