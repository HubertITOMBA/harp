import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ViewMenuContent } from "@/components/menu/ViewMenuContent";
import { ViewMenuDialog } from "@/components/menu/ViewMenuDialog";
import { EditMenuDialog } from "@/components/menu/EditMenuDialog";
import { listVisibleMenuRoles } from "@/lib/rbac-menu-coherence";
import { getAllHarpRoles, getMenuById } from "@/lib/actions/menu-actions";
import { readMenuFamilyCoherence } from "@/actions/rbac-admin";
import { updateMenu } from "@/actions/update-menu";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/actions/menu-actions", () => ({
  getMenuById: jest.fn(),
  getAllHarpRoles: jest.fn(),
}));

jest.mock("@/actions/rbac-admin", () => ({
  readMenuFamilyCoherence: jest.fn(),
}));

jest.mock("@/actions/update-menu", () => ({
  updateMenu: jest.fn(),
}));

const known = ["TMA_LOCAL", "PORTAL_ADMIN"];

function menu(overrides: Record<string, unknown> = {}) {
  return {
    id: 3,
    menu: "DEVOPS 1",
    href: "/devops",
    descr: "Devops",
    icone: null,
    display: 2,
    level: 3,
    active: 1,
    role: "TMA_LOCAL" as string | null,
    harpmenurole: [] as Array<{ harproles: { id: number; role: string; descr: string | null } | null }>,
    ...overrides,
  };
}

describe("rôles visibles d'un menu", () => {
  it("affiche un rôle présent seulement dans la colonne", () => {
    const visible = listVisibleMenuRoles({
      columnRole: "TMA_LOCAL",
      linked: [],
      knownRoleNames: known,
    });
    expect(visible.roles.map((role) => role.role)).toEqual(["TMA_LOCAL"]);
    expect(visible.unrecognizedRole).toBeNull();
  });

  it("affiche un rôle présent seulement dans harpmenurole", () => {
    const visible = listVisibleMenuRoles({
      columnRole: null,
      linked: [{ role: "TMA_LOCAL", descr: "local" }],
      knownRoleNames: known,
    });
    expect(visible.roles).toEqual([
      { role: "TMA_LOCAL", descr: "local", unrecognized: false },
    ]);
  });

  it("n'affiche qu'une fois un rôle présent dans les deux sources", () => {
    const visible = listVisibleMenuRoles({
      columnRole: "TMA_LOCAL",
      linked: [{ role: "TMA_LOCAL", descr: "local" }],
      knownRoleNames: known,
    });
    expect(visible.roles).toHaveLength(1);
  });

  it("signale une restriction historique inconnue", () => {
    const visible = listVisibleMenuRoles({
      columnRole: "ANCIEN_ROLE",
      linked: [],
      knownRoleNames: known,
    });
    expect(visible.unrecognizedRole).toBe("ANCIEN_ROLE");
    expect(visible.roles[0]?.unrecognized).toBe(true);
  });
});

describe("dialogue Voir", () => {
  it("montre TMA_LOCAL pour DEVOPS 1 sans le message de liste vide", () => {
    render(
      <ViewMenuContent
        menu={menu()}
        knownRoleNames={known}
      />
    );
    expect(screen.getAllByText("TMA_LOCAL")).toHaveLength(2);
    expect(screen.getByText("Rôle principal")).toBeInTheDocument();
    expect(screen.queryByText("Aucun rôle n'est associé à ce menu pour le moment.")).not.toBeInTheDocument();
  });

  it("signale la restriction au lieu de la masquer", () => {
    render(
      <ViewMenuContent
        menu={menu({ role: "ANCIEN_ROLE" })}
        knownRoleNames={known}
      />
    );
    expect(
      screen.getByText("La restriction historique « ANCIEN_ROLE » ne correspond à aucun rôle harproles.")
    ).toBeInTheDocument();
    expect(screen.getAllByText("ANCIEN_ROLE").length).toBeGreaterThan(1);
  });

  it("affiche la carte Cohérence RBAC pour un menu de niveau 3", async () => {
    (getMenuById as jest.Mock).mockResolvedValue(menu());
    (getAllHarpRoles as jest.Mock).mockResolvedValue(known.map((role, id) => ({ id, role, descr: null })));
    (readMenuFamilyCoherence as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        kind: "matched",
        typenvid: 2,
        typenv: "DEVOPS",
        descr: null,
        menuRoles: ["TMA_LOCAL"],
        subroles: [],
        coherence: { menuHasNoRoleRestriction: false, menuWithoutGrant: [], grantWithoutMenu: [] },
      },
    });

    render(<ViewMenuDialog menuId={3} open onOpenChange={jest.fn()} />);
    expect(await screen.findByRole("heading", { name: "Cohérence RBAC" })).toBeInTheDocument();
    expect(readMenuFamilyCoherence).toHaveBeenCalledWith(3);
  });

  it("n'affiche pas la carte pour un autre niveau", async () => {
    (getMenuById as jest.Mock).mockResolvedValue(menu({ level: 1 }));
    (getAllHarpRoles as jest.Mock).mockResolvedValue([]);
    (readMenuFamilyCoherence as jest.Mock).mockClear();

    render(<ViewMenuDialog menuId={8} open onOpenChange={jest.fn()} />);
    expect(await screen.findByText("Rôle principal")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Cohérence RBAC" })).not.toBeInTheDocument();
    expect(readMenuFamilyCoherence).not.toHaveBeenCalled();
  });

  it("affiche l'erreur de lecture sans écrire", async () => {
    (getMenuById as jest.Mock).mockResolvedValue(menu());
    (getAllHarpRoles as jest.Mock).mockResolvedValue([]);
    (readMenuFamilyCoherence as jest.Mock).mockResolvedValue({
      success: false,
      error: "Accès refusé",
    });

    render(<ViewMenuDialog menuId={3} open onOpenChange={jest.fn()} />);
    expect(await screen.findByText("Accès refusé")).toBeInTheDocument();
  });
});

describe("formulaire Modifier", () => {
  it("n'envoie pas le champ role et conserve les autres champs", async () => {
    (updateMenu as jest.Mock).mockResolvedValue({ success: true, message: "Menu mis à jour" });
    render(
      <EditMenuDialog
        menu={{
          id: 3,
          menu: "DEVOPS 1",
          href: "/devops",
          descr: "Devops",
          icone: null,
          display: 2,
          level: 3,
          active: 1,
          role: "TMA_LOCAL",
        }}
        open
        onOpenChange={jest.fn()}
      />
    );

    expect(screen.getByText("TMA_LOCAL")).toBeInTheDocument();
    expect(screen.getByText("Les rôles associés se gèrent depuis l'action Rôles HARP.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Nom du menu/i), { target: { value: "DEVOPS 1b" } });
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer les modifications/i }));

    await waitFor(() => expect(updateMenu).toHaveBeenCalled());
    const form = (updateMenu as jest.Mock).mock.calls[0][1] as FormData;
    expect(form.get("role")).toBeNull();
    expect(form.get("menu")).toBe("DEVOPS 1b");
    expect(form.get("href")).toBe("/devops");
    expect(form.get("active")).toBe("1");
  });
});
