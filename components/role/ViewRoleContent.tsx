"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Users } from "lucide-react";
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
import { useState } from "react";

interface UserWithRole {
  id: number;
  netid: string | null;
  nom: string | null;
  prenom: string | null;
  email: string | null;
}

interface ViewRoleContentProps {
  role: {
    id: number;
    role: string;
    descr: string;
    slug: string | null;
    harpuseroles: Array<{
      user: UserWithRole;
    }>;
  };
}

type UserRow = UserWithRole;

const userColumns: ColumnDef<UserRow>[] = [
  {
    accessorKey: 'netid',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-7 text-[10px] sm:text-xs"
        >
          Net ID
          <ArrowUpDown className='ml-1 h-2.5 w-2.5' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="font-semibold text-[10px] sm:text-xs">{row.getValue('netid')}</div>
    }
  },
  {
    accessorKey: 'nom',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-7 text-[10px] sm:text-xs"
        >
          Nom
          <ArrowUpDown className='ml-1 h-2.5 w-2.5' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="text-[10px] sm:text-xs">{row.getValue('nom') || '-'}</div>
    }
  },
  {
    accessorKey: 'prenom',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-7 text-[10px] sm:text-xs"
        >
          Prénom
          <ArrowUpDown className='ml-1 h-2.5 w-2.5' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="text-[10px] sm:text-xs">{row.getValue('prenom') || '-'}</div>
    }
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-7 text-[10px] sm:text-xs"
        >
          Email
          <ArrowUpDown className='ml-1 h-2.5 w-2.5' />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="text-[10px] sm:text-xs">{row.getValue('email') || '-'}</div>
    }
  },
];

export function ViewRoleContent({ role }: ViewRoleContentProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const users = role.harpuseroles.map(ur => ur.user);

  const table = useReactTable({
    data: users,
    columns: userColumns,
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
      {/* Informations générales */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="harp-card-header py-2 px-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Shield className="h-4 w-4" />
            </div>
            <CardTitle className="text-base sm:text-lg">Informations générales</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3">
            <div className="space-y-1">
              <Label className="text-[9px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <Shield className="h-2.5 w-2.5 text-orange-600" />
                Nom du rôle
              </Label>
              <div className="p-2 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 font-mono shadow-sm">
                {role.role}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                <FileText className="h-2.5 w-2.5 text-orange-600" />
                Description
              </Label>
              <div className="p-2 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
                {role.descr}
              </div>
            </div>
            {role.slug && (
              <div className="space-y-1 md:col-span-2">
                <Label className="text-[9px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-t-md">
                  <Shield className="h-2.5 w-2.5 text-orange-600" />
                  Slug
                </Label>
                <div className="p-2 bg-orange-50 rounded-md rounded-tl-none border border-orange-200 border-t-0 text-xs font-medium text-slate-900 shadow-sm">
                  {role.slug}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs */}
      {users.length > 0 && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg py-2 px-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
              <CardTitle className="text-base sm:text-lg">
                {users.length} Utilisateur{users.length > 1 ? 's' : ''} avec ce rôle
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
                      <TableCell colSpan={userColumns.length} className="h-16 text-center text-xs">
                        Aucun utilisateur.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {users.length === 0 && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-xs sm:text-sm">Aucun utilisateur n&apos;a ce rôle pour le moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

