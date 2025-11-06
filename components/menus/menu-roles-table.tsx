"use client";

import { DataTable } from "@/app/(dashboard)/list/menus/[id]/data-table";
import { createMenuRolesColumns } from "@/app/(dashboard)/list/menus/[id]/columns";
import { AddMenuRoleForm } from "@/components/menus/add-menu-role-form";

interface MenuRole {
  menuId: number;
  roleId: number;
  datmaj: Date;
  harproles: {
    id: number;
    role: string;
    descr: string;
  };
}

interface Role {
  id: number;
  role: string;
  descr: string;
}

interface MenuRolesTableProps {
  menuId: number;
  menuRoles: MenuRole[];
  availableRoles: Role[];
  currentRoleIds: number[];
  menuName: string;
}

/**
 * Composant client pour afficher et gérer les rôles d'un menu dans un DataTable
 */
export function MenuRolesTable({
  menuId,
  menuRoles,
  availableRoles,
  currentRoleIds,
  menuName,
}: MenuRolesTableProps) {
  const columns = createMenuRolesColumns(menuId);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">
          Autorisations pour <span className="uppercase">{menuName}</span>
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({menuRoles.length} rôle(s))
          </span>
        </h1>
        <AddMenuRoleForm
          menuId={menuId}
          availableRoles={availableRoles}
          currentRoleIds={currentRoleIds}
        />
      </div>

      {/* DataTable TanStack */}
      <div className="bg-card rounded-xl shadow-xl overflow-hidden">
        <DataTable columns={columns} data={menuRoles} />
      </div>
    </div>
  );
}

