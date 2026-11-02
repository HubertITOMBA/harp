import fs from "fs";
import path from "path";
import { canAccessActiveMenu, canAccessTypeEnv, PORTAL_ADMIN_ROLE } from "@/lib/user-roles";
import {
  classifyMenuFamilyCoherence,
  collectMenuRoleNames,
  emptyRoleSubrolesMessage,
  matchMenuDisplayToFamily,
} from "@/lib/rbac-menu-coherence";

describe("séparation menu et RBAC des familles", () => {
  it("laisse le menu visible et refuse la famille sans grant", () => {
    expect(canAccessActiveMenu(["TMA_LOCAL"], ["TMA_LOCAL"])).toBe(true);
    expect(canAccessTypeEnv({ userRoles: ["TMA_LOCAL"], typenvid: 8, grants: [] })).toBe(false);
  });

  it("masque le menu et autorise la famille lorsque le grant existe", () => {
    expect(canAccessActiveMenu(["TMA_LOCAL"], ["PSADMIN"])).toBe(false);
    expect(canAccessTypeEnv({
      userRoles: ["TMA_LOCAL"],
      typenvid: 8,
      grants: [{ role: "TMA_LOCAL", active: true, typenvid: 8 }],
    })).toBe(true);
  });

  it("ne ferme pas les familles à PORTAL_ADMIN sans sous-rôle", () => {
    expect(emptyRoleSubrolesMessage(PORTAL_ADMIN_ROLE)).toBe(
      "Aucun sous-rôle n'est associé à ce rôle."
    );
    expect(emptyRoleSubrolesMessage("TMA_LOCAL")).toBe(
      "Aucun sous-rôle n'est associé à ce rôle. Sans sous-rôle actif, ce rôle n'ouvre aucune famille."
    );
  });

  it("laisse PORTAL_ADMIN voir le menu et la famille sans grant", () => {
    expect(canAccessActiveMenu([PORTAL_ADMIN_ROLE], ["PSADMIN"])).toBe(true);
    expect(canAccessTypeEnv({ userRoles: [PORTAL_ADMIN_ROLE], typenvid: 8, grants: [] })).toBe(true);
    const coherence = classifyMenuFamilyCoherence({
      menuRoles: [PORTAL_ADMIN_ROLE],
      familyLinks: [],
    });
    expect(coherence.menuWithoutGrant).not.toContain(PORTAL_ADMIN_ROLE);
    expect(coherence.grantWithoutMenu).not.toContain(PORTAL_ADMIN_ROLE);
  });

  it("ne change pas le menu quand le sous-rôle est inactif et refuse la famille", () => {
    expect(canAccessActiveMenu(["TMA_LOCAL"], ["TMA_LOCAL"])).toBe(true);
    expect(canAccessTypeEnv({
      userRoles: ["TMA_LOCAL"],
      typenvid: 8,
      grants: [{ role: "TMA_LOCAL", active: false, typenvid: 8 }],
    })).toBe(false);
    expect(classifyMenuFamilyCoherence({
      menuRoles: ["TMA_LOCAL"],
      familyLinks: [{ role: "TMA_LOCAL", active: false }],
    }).menuWithoutGrant).toEqual(["TMA_LOCAL"]);
  });

  it("garde un menu sans rôle visible sans ouvrir la famille", () => {
    expect(canAccessActiveMenu(["USER"], [])).toBe(true);
    expect(canAccessTypeEnv({ userRoles: ["USER"], typenvid: 8, grants: [] })).toBe(false);
    expect(classifyMenuFamilyCoherence({
      menuRoles: [],
      familyLinks: [{ role: "TMA_LOCAL", active: true }],
    })).toEqual({
      menuHasNoRoleRestriction: true,
      menuWithoutGrant: [],
      grantWithoutMenu: [],
    });
  });

  it("n'invente pas de famille quand display ne correspond pas", () => {
    expect(matchMenuDisplayToFamily(12, null)).toBe("unmatched");
    expect(matchMenuDisplayToFamily(12, 4)).toBe("unmatched");
    expect(matchMenuDisplayToFamily(0, 0)).toBe("unmatched");
  });

  it("prend en compte la colonne du menu et harpmenurole", () => {
    expect(collectMenuRoleNames({
      columnRole: PORTAL_ADMIN_ROLE,
      associatedRoles: ["TMA_LOCAL", PORTAL_ADMIN_ROLE],
    })).toEqual([PORTAL_ADMIN_ROLE, "TMA_LOCAL"]);
    expect(classifyMenuFamilyCoherence({
      menuRoles: [PORTAL_ADMIN_ROLE, "TMA_LOCAL"],
      familyLinks: [{ role: "FT-MOE", active: true }],
    })).toEqual({
      menuHasNoRoleRestriction: false,
      menuWithoutGrant: ["TMA_LOCAL"],
      grantWithoutMenu: ["FT-MOE"],
    });
  });

  it("n'utilise pas le menu comme contrôle de /harp/envs/[id]", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app", "(protected)", "harp", "envs", "[id]", "page.tsx"),
      "utf8"
    );
    expect(source).toContain("canAccessTypeEnvForSession");
    expect(source).not.toContain("canAccessActiveMenu");
    expect(source).not.toContain("authorizeIdentifiedMenu");
  });

  it("réunit les familles de plusieurs rôles et ignore un rôle sans sous-rôle", () => {
    expect(canAccessTypeEnv({
      userRoles: ["TMA_LOCAL", "FT-MOE"],
      typenvid: 12,
      grants: [{ role: "FT-MOE", active: true, typenvid: 12 }],
    })).toBe(true);
    expect(canAccessTypeEnv({
      userRoles: ["TMA_LOCAL"],
      typenvid: 12,
      grants: [],
    })).toBe(false);
  });
});
