"use client"

import React from 'react'
import { ITEM_PER_PAGE } from "@/lib/settings";
import { useRouter } from 'next/navigation';


const Pagination = ({page, count}: {page: number; count: number }) => {

  const router = useRouter();

  const hasPrev = ITEM_PER_PAGE * (page - 1) > 0;
  const hasNext = ITEM_PER_PAGE * (page - 1) + ITEM_PER_PAGE < count;

  const changePage = (newPage:number)=>{
    const params = new URLSearchParams(window.location.search)
    params.set("page",newPage.toString())
    router.push(`${window.location.pathname}?${params}`);
  }

  return (
    <div className="p-1 flex items-center justify-between bg-harpOrange text-white font-semibold">
          <button 
                disabled={!hasPrev} 
                className="py-1 px-4 rounded-xl bg-black  text-whaite text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  changePage(page - 1);
                }} 
          >
              Précedent
          </button>
          <div className="flex items-center gap-2 text-sm">
                {Array.from
                  ( { length: Math.ceil( count / ITEM_PER_PAGE ) },
                    (_, index ) => {
                        const pageIndex = index + 1;
                        return (
                            <button 
                                key={pageIndex}
                                className={`px-2 rounded-sm ${
                                     page === pageIndex ? "bg-green-900" : ""
                                 }`}
                                onClick={() => {
                                  changePage(pageIndex);
                                }} 
                            >
                                {pageIndex}
                            </button>
                        );
                      }
                  )}
          </div>
        <button 
              className="py-1 px-4 rounded-xl bg-black text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!hasNext}
              onClick={() => {
                changePage(page + 1);
              }} 
        >
          Suivant
        </button>
    </div>
  )
}

export default Pagination