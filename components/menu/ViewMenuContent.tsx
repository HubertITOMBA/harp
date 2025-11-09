"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Menu, Shield } from "lucide-react";
import Image from "next/image";
import { 
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";

interface RoleWithMenu {
  id: number;
  role: string;
  descr: string;
}

interface ViewMenuContentProps {
  menu: {
    id: number;
    menu: string;
    href: string | null;
    descr: string | null;
    icone: string | null;
    display: number;
    level: number;
    active: number;
    role: string | null;
    harpmenurole: Array<{
      harproles: RoleWithMenu | null;
    }>;
  };
}

type RoleRow = RoleWithMenu;

const roleColumns: ColumnDef<RoleRow>[] = [
  {
    accessorKey: 'role',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-7 text-[10px] sm:text-xs"
        >
          Rôle
          <ArrowUpDown className='ml-1 h-2.5 w-2.5' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="font-semibold text-[10px] sm:text-xs">{row.getValue('role')}</div>
    }
  },
  {
    accessorKey: 'descr',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-7 text-[10px] sm:text-xs"
        >
          Description
          <ArrowUpDown className='ml-1 h-2.5 w-2.5' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="text-[10px] sm:text-xs">{row.getValue('descr') || '-'}</div>
    }
  },
];

export function ViewMenuContent({ menu }: ViewMenuContentProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // Extraire les rôles depuis harpmenurole
  const roles = menu.harpmenurole
    .map(mr => mr.harproles)
    .filter((role): role is RoleWithMenu => role !== null);

  const table = useReactTable({
    data: roles,
    columns: roleColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="space-y-3">
      {/* Informations principales */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="harp-card-header py-2 px-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Menu className="h-4 w-4" />
            </div>
            <CardTitle className="text-base sm:text-lg">Informations générales</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3">
            <div className="space-y-1">
              <Label className="text-[9px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <Menu className="h-2.5 w-2.5 text-orange-600" />
                ID
              </Label>
              <div className="p-2 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
                {menu.id}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <Menu className="h-2.5 w-2.5 text-orange-600" />
                Nom du menu
              </Label>
              <div className="p-2 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                {menu.menu}
              </div>
            </div>
            {menu.href && (
              <div className="space-y-1">
                <Label className="text-[9px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                  <Menu className="h-2.5 w-2.5 text-orange-600" />
                  URL
                </Label>
                <div className="p-2 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 break-all shadow-sm">
                  {menu.href}
                </div>
              </div>
            )}
            {menu.icone && (
              <div className="space-y-1">
                <Label className="text-[9px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                  <Menu className="h-2.5 w-2.5 text-orange-600" />
                  Icône
                </Label>
                <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 shadow-sm">
                  <Image 
                    src={`/ressources/${menu.icone}`} 
                    alt="" 
                    width={20} 
                    height={20} 
                    className="bg-transparent"
                  />
                  <span className="text-xs font-medium text-slate-900">{menu.icone}</span>
                </div>
              </div>
            )}
            {menu.descr && (
              <div className="space-y-1">
                <Label className="text-[9px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                  <Menu className="h-2.5 w-2.5 text-orange-600" />
                  Description
                </Label>
                <div className="p-2 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
                  {menu.descr}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-[9px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <Menu className="h-2.5 w-2.5 text-orange-600" />
                Ordre d&apos;affichage
              </Label>
              <div className="p-2 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
                {menu.display}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <Menu className="h-2.5 w-2.5 text-orange-600" />
                Niveau
              </Label>
              <div className="p-2 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
                {menu.level}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <Menu className="h-2.5 w-2.5 text-orange-600" />
                Statut
              </Label>
              <div className="p-2 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
                {menu.active === 1 ? "Actif" : "Inactif"}
              </div>
            </div>
            {menu.role && (
              <div className="space-y-1">
                <Label className="text-[9px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                  <Menu className="h-2.5 w-2.5 text-orange-600" />
                  Rôle principal
                </Label>
                <div className="p-2 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
                  {menu.role}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des rôles associés */}
      {roles.length > 0 && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg py-2 px-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Shield className="h-4 w-4" />
              </div>
              <CardTitle className="text-base sm:text-lg">
                {roles.length} Rôle{roles.length > 1 ? 's' : ''} associé{roles.length > 1 ? 's' : ''} à ce menu
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="overflow-x-auto">
              <Table className="min-w-full divide-y divide-gray-200">
                <TableHeader className="bg-harpOrange text-white text-center text-[10px] sm:text-xs font-bold">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="h-7 sm:h-8">
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} className="text-white bg-harpOrange text-center py-1 px-2">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="divide-y divide-gray-200 bg-white">
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="hover:bg-harpSkyLight transition-colors duration-200 h-7 sm:h-8"
                      >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-1 px-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={roleColumns.length} className="h-16 text-center text-xs">
                        Aucun rôle.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {roles.length === 0 && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center text-gray-500">
            <Shield className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-xs sm:text-sm">Aucun rôle n&apos;est associé à ce menu pour le moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

