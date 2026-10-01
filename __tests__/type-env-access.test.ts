import prisma from "@/lib/prisma";
import { getAllUserRoles } from "@/actions/get-all-user-roles";
import { canAccessTypeEnvForSession } from "@/lib/type-env-access";

jest.mock("@/actions/get-all-user-roles", () => ({
  getAllUserRoles: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    harprolesubrole: { findMany: jest.fn() },
  },
}));

const roles = getAllUserRoles as jest.MockedFunction<typeof getAllUserRoles>;
const findGrants = prisma.harprolesubrole.findMany as jest.Mock;

describe("canAccessTypeEnvForSession", () => {
  beforeEach(() => {
    roles.mockReset();
    findGrants.mockReset();
  });

  it("autorise PORTAL_ADMIN sans lire les jointures", async () => {
    roles.mockResolvedValue(["PORTAL_ADMIN"]);

    await expect(canAccessTypeEnvForSession(12)).resolves.toBe(true);
    expect(findGrants).not.toHaveBeenCalled();
  });

  it("autorise un rôle dont le sous-rôle actif porte le typenvid", async () => {
    roles.mockResolvedValue(["USER", "FT-MOE"]);
    findGrants.mockResolvedValue([
      {
        harproles: { role: "FT-MOE" },
        harpsubrole: {
          active: true,
          harpsubroletypenv: [{ typenvid: 10 }, { typenvid: 12 }],
        },
      },
    ]);

    await expect(canAccessTypeEnvForSession(12)).resolves.toBe(true);
    expect(findGrants).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { harproles: { role: { in: ["USER", "FT-MOE"] } } },
      })
    );
  });

  it("refuse un sous-rôle inactif et une erreur de lecture", async () => {
    roles.mockResolvedValue(["TMA_LOCAL"]);
    findGrants.mockResolvedValue([
      {
        harproles: { role: "TMA_LOCAL" },
        harpsubrole: { active: false, harpsubroletypenv: [{ typenvid: 8 }] },
      },
    ]);
    await expect(canAccessTypeEnvForSession(8)).resolves.toBe(false);

    findGrants.mockRejectedValue(new Error("base indisponible"));
    await expect(canAccessTypeEnvForSession(8)).resolves.toBe(false);
  });
});
