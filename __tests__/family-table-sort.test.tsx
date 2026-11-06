import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FamilyAdminRow } from "@/lib/family-admin-read";
import { compareFamilies, FamilyTable, sortFamilies } from "@/components/family/FamilyTable";

jest.mock("@/components/family/EditFamilyDialog", () => ({
  EditFamilyDialog: () => <button type="button">Modifier</button>,
}));

jest.mock("@/components/family/DeleteFamilyButton", () => ({
  DeleteFamilyButton: () => <button type="button">Supprimer</button>,
}));

function row(overrides: Partial<FamilyAdminRow> & Pick<FamilyAdminRow, "id" | "typenv">): FamilyAdminRow {
  return {
    typenvid: overrides.id,
    descr: null,
    environmentCount: 0,
    menus: [],
    subroleCount: 0,
    activeSubroleCount: 0,
    withoutMenu: true,
    hasRbac: false,
    ...overrides,
  };
}

function names(sorted: FamilyAdminRow[]): string[] {
  return sorted.map((family) => family.typenv);
}

describe("comparaison des familles", () => {
  const alpha = row({ id: 2, typenvid: 2, typenv: "Alpha", descr: "Bravo", environmentCount: 1 });
  const bravo = row({ id: 10, typenvid: 10, typenv: "Bravo", descr: "Alpha", environmentCount: 4 });
  const missing = row({ id: 3, typenvid: null, typenv: "Manquant", descr: "", environmentCount: 4 });

  it("trie les nombres et les noms en ordre croissant", () => {
    const sortedIds = sortFamilies([bravo, missing, alpha], { column: "typenvid", direction: "asc" });
    expect(names(sortedIds)).toEqual(["Alpha", "Bravo", "Manquant"]);

    const sortedNames = sortFamilies([bravo, alpha], { column: "name", direction: "asc" });
    expect(names(sortedNames)).toEqual(["Alpha", "Bravo"]);
  });

  it("inverse les valeurs présentes et laisse les absentes en dernier", () => {
    const byId = sortFamilies([alpha, missing, bravo], { column: "typenvid", direction: "desc" });
    expect(names(byId)).toEqual(["Bravo", "Alpha", "Manquant"]);

    const byDescription = sortFamilies([alpha, missing, bravo], { column: "description", direction: "desc" });
    expect(names(byDescription)).toEqual(["Alpha", "Bravo", "Manquant"]);
  });

  it("départage les égalités par typenvid croissant puis par le nom", () => {
    const low = row({ id: 2, typenvid: 2, typenv: "Zèbre", environmentCount: 4 });
    const high = row({ id: 10, typenvid: 10, typenv: "Alpha", environmentCount: 4 });
    const noIdB = row({ id: 8, typenvid: null, typenv: "Bravo", environmentCount: 4 });
    const noIdA = row({ id: 9, typenvid: null, typenv: "Arbre", environmentCount: 4 });

    const sorted = sortFamilies([high, noIdB, low, noIdA], { column: "environments", direction: "desc" });
    expect(names(sorted)).toEqual(["Zèbre", "Alpha", "Arbre", "Bravo"]);
  });

  it("compare les menus visibles, les sous-rôles et la cohérence", () => {
    const inactive = row({
      id: 5,
      typenvid: 5,
      typenv: "Inactif",
      menus: [{ id: 1, menu: "COMPTA", display: 5, active: 0 }],
      withoutMenu: false,
      subroleCount: 2,
      activeSubroleCount: 0,
      hasRbac: true,
    });
    const active = row({
      id: 4,
      typenvid: 4,
      typenv: "Actif",
      menus: [{ id: 2, menu: "ACHAT", display: 4, active: 1 }],
      withoutMenu: false,
      hasRbac: false,
      subroleCount: 2,
      activeSubroleCount: 1,
    });
    const none = row({ id: 6, typenvid: 6, typenv: "Aucun", subroleCount: 1, activeSubroleCount: 1 });

    expect(names(sortFamilies([inactive, none, active], { column: "menu", direction: "desc" }))).toEqual([
      "Inactif",
      "Actif",
      "Aucun",
    ]);
    expect(names(sortFamilies([inactive, none, active], { column: "subroles", direction: "asc" }))).toEqual([
      "Aucun",
      "Inactif",
      "Actif",
    ]);
    expect(compareFamilies(active, inactive, { column: "coherence", direction: "asc" })).toBeLessThan(0);
  });

  it("trie toute la liste avant d'en prendre la première page", () => {
    const source = [row({ id: 30, typenvid: 30, typenv: "Trente" }), row({ id: 1, typenvid: 1, typenv: "Un" })];
    const firstPage = sortFamilies(source, { column: "typenvid", direction: "asc" }).slice(0, 1);
    expect(names(firstPage)).toEqual(["Un"]);
    expect(names(source)).toEqual(["Trente", "Un"]);
  });
});

describe("tri dans le tableau", () => {
  const families = Array.from({ length: 21 }, (_, index) => {
    const typenvid = index + 1;
    return row({
      id: typenvid,
      typenvid,
      typenv: typenvid === 1 ? "Zzz" : typenvid === 21 ? "Aaa" : "Mmm",
    });
  });

  it("change le sens et revient à la page 1", async () => {
    const user = userEvent.setup();
    render(<FamilyTable families={families} />);

    expect(screen.getByRole("columnheader", { name: "typenvid" })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByRole("cell", { name: "Zzz" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Actions" })?.querySelector("button")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Suivant" }));
    expect(screen.getByText("Page 2 sur 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nom" }));
    expect(screen.getByRole("columnheader", { name: "Nom" })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByText("Page 1 sur 2")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Aaa" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nom" }));
    expect(screen.getByRole("columnheader", { name: "Nom" })).toHaveAttribute("aria-sort", "descending");
    expect(screen.getByText("Page 1 sur 2")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Zzz" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Aaa" })).not.toBeInTheDocument();
  });
});
