"use client"

import { title } from "process";
import { useState } from "react";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Image from "next/image";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece]; 

const events = [
    {
        id: 1,
        title: "Lorem ipsum dolor sit amet",
        time: "12:00 PM -2:00 PM",
        description: "Lorem ipsum dolor sit amet consectetur adipisicing elit Pariatur ullam soluta saepe quisquam quasi rem commodi veritatis itaque dolores repellat quam at aperiam laborum fugit possimus culpa sunt ratione quod dolores atque.",
    },
    {
        id: 2,
        title: "Lorem ipsum dolor sit amet",
        time: "12:00 PM -2:00 PM",
        description: "Lorem ipsum dolor sit amet consectetur adipisicing elit Pariatur ullam soluta saepe quisquam quasi rem commodi veritatis itaque dolores repellat quam at aperiam laborum fugit possimus culpa sunt ratione quod dolores atque.",
    },
    {
        id: 3,
        title: "Lorem ipsum dolor sit amet",
        time: "12:00 PM -2:00 PM",
        description: "Lorem ipsum dolor sit amet consectetur adipisicing elit Pariatur ullam soluta saepe quisquam quasi rem commodi veritatis itaque dolores repellat quam at aperiam laborum fugit possimus culpa sunt ratione quod dolores atque.",
    }
]



const EventCalendar = () => {
    const [value, onChange] = useState<Value>(new Date());


  return (
    <div className="bg-white">
         <Calendar onChange={onChange} value={value} />
         {/* <div className="flex items-center justify-between">
            <h1 className="capitalize text-xl font-semibold my-4">événements</h1>
            <Image src="/ressources/moreDark.png" width={20} height={20} alt="logo" />
         </div>
         <div className="flex flex-col gap-4">
            {events.map(event=>(
                <div className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-fmkSky even:border-t-fmkSkyLight" key={event.id}>
                    <div className="flex items-center justify-between">
                        <h1 className="font-semibold text-gray-600">{event.title}</h1>
                        <span className="text-gray-300 text-xs">{event.time}</span>
                    </div>
                    <p className="mt-2 text-gray-400 text-sm">{event.description}</p>
                </div>
            ))}

         </div> */}
    </div>
  )
}

export default EventCalendar