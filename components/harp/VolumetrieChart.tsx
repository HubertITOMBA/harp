"use client"

import { RadialBarChart, RadialBar, Legend, ResponsiveContainer } from 'recharts';
import Image from 'next/image'

const data = [
  {
    name: '10K',
    count: 10000,
    fill: '#8884d8',
  },
  {
    name: '150k',
    count: 150000,
    // fill: '#83a6ed',
    fill: '#a4de6c',
  },
  {
    name: '4k',
    count: 4000,
    fill: '#8dd1e1',
  },
  // {
  //   name: '35-39',
  //   uv: 8.22,
  //   pv: 9800,
  //   fill: '#82ca9d',
  // },
  // {
  //   name: '40-49',
  //   uv: 8.63,
  //   pv: 3908,
  //   fill: '#a4de6c',
  // },
  // {
  //   name: '50+',
  //   uv: 2.63,
  //   pv: 4800,
  //   fill: '#d0ed57',
  // },
  // {
  //   name: 'unknow',
  //   uv: 6.67,
  //   pv: 4800,
  //   fill: '#ffc658',
  // },
];

const style = {
  top: '50%',
  right: 0,
  transform: 'translate(0, -50%)',
  lineHeight: '24px',
};

const VolumetrieChart = () => {
    return (
      <div className='bg-white rounded-xl w-full h-full p-4'>
           {/** TITRE */}
          <div className='flex justify-between items-center'>
                <h1 className='text-lg font-semibold'>Volumetrie</h1>
                <Image src="/ressources/moreDark.png" width={20} height={20} alt="" />
          </div> 

          {/** GRAPHIQUE */}
          <div className='relative w-full h-[75%]'>
              <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="40%" 
                  outerRadius="100%" 
                  barSize={32} 
                  data={data}
              >
                
              <RadialBar 
                  background 
                  dataKey="count"
                  label={{ position: 'insideStart', fill: '#fff' }}
                  // dataKey="uv"
                  />
               </RadialBarChart>
              
              </ResponsiveContainer>
              <Image className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" src="/ressources/maleFemale.png" width={50} height={50} alt="logo"/>
          </div> 

          {/** BAS    */}
          <div className='flex items-center justify-center gap-16'>
              
              <div className='flex flex-col-2 justify-between gap-1'>
                  <div className='w-5 h-5 bg-fmkSky rounded-full '>
                      <h1 className='font-bold mt-5'>1,234</h1>
                      <h2 className='text-xs text-gray-500'>150k (55%)</h2>
                  </div>
                  
                  <div className='flex flex-col-2 gap-1'>
                      <div className='flex w-5 h-5 bg-fmkSkyLight rounded-full'>
                          <h1 className='font-bold  mt-5'>1,234</h1>
                          <h2 className='text-xs text-gray-500'>4k (45%)</h2>
                      </div>
                  </div> 
              </div>
             
          </div> 

      </div> 
    );
  }
 export default VolumetrieChart


 