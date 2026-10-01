/**
 * @jest-environment node
 */
import prisma from "@/lib/prisma";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { loadVisibleEnvironmentNames, authorizeResolvedEnvironment } from "@/lib/environment-access";
import { GET as getEnvironments } from "@/app/api/environments/route";
import { GET as getLegacyServers } from "@/app/api/getServerData/route";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/environment-access", () => ({
  loadVisibleEnvironmentNames: jest.fn(),
  authorizeResolvedEnvironment: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    psadm_env: { findMany: jest.fn() },
    envsharp: { findUnique: jest.fn() },
  },
}));

jest.mock("@/lib/db", () => ({
  db: {
    psadm_rolesrv: { findMany: jest.fn() },
  },
}));

const visibleNames = loadVisibleEnvironmentNames as jest.MockedFunction<typeof loadVisibleEnvironmentNames>;
const access = authorizeResolvedEnvironment as jest.MockedFunction<typeof authorizeResolvedEnvironment>;
const sessionAuth = auth as jest.MockedFunction<typeof auth>;
const legacyEnvs = prisma.psadm_env.findMany as jest.Mock;
const findEnv = prisma.envsharp.findUnique as jest.Mock;
const legacyServers = db.psadm_rolesrv.findMany as jest.Mock;

describe("GET /api/environments", () => {
  beforeEach(() => {
    visibleNames.mockReset();
    legacyEnvs.mockReset();
  });

  it("refuse sans session et ne lit pas psadm_env", async () => {
    visibleNames.mockResolvedValue(null);
    const response = await getEnvironments();
    expect(response.status).toBe(401);
    expect(legacyEnvs).not.toHaveBeenCalled();
  });

  it("ne retourne que les noms visibles", async () => {
    visibleNames.mockResolvedValue({ unrestricted: false, names: ["VISIBLE11"] });
    legacyEnvs.mockResolvedValue([{ env: "VISIBLE11", descr: "ok", site: "IDA" }]);
    const response = await getEnvironments();
    expect(response.status).toBe(200);
    expect(legacyEnvs).toHaveBeenCalledWith(
      expect.objectContaining({ where: { env: { in: ["VISIBLE11"] } } })
    );
  });

  it("ne filtre pas les noms pour PORTAL_ADMIN", async () => {
    visibleNames.mockResolvedValue({ unrestricted: true });
    legacyEnvs.mockResolvedValue([]);
    await getEnvironments();
    expect(legacyEnvs).toHaveBeenCalledWith(expect.objectContaining({ where: undefined }));
  });
});

describe("GET /api/getServerData", () => {
  beforeEach(() => {
    sessionAuth.mockReset();
    access.mockReset();
    findEnv.mockReset();
    legacyServers.mockReset();
    sessionAuth.mockResolvedValue({ user: { id: "7" } } as never);
  });

  it("ne lit pas FHHPR1 si la décision centrale refuse", async () => {
    findEnv.mockResolvedValue({ id: 4, typenvid: 13, scopeId: 41 });
    access.mockResolvedValue(403);
    const response = await getLegacyServers();
    expect(response.status).toBe(403);
    expect(legacyServers).not.toHaveBeenCalled();
  });

  it("lit les serveurs legacy seulement si FHHPR1 est visible", async () => {
    findEnv.mockResolvedValue({ id: 4, typenvid: 11, scopeId: 41 });
    access.mockResolvedValue(200);
    legacyServers.mockResolvedValue([]);
    const response = await getLegacyServers();
    expect(response.status).toBe(200);
    expect(findEnv).toHaveBeenCalledWith(expect.objectContaining({ where: { env: "FHHPR1" } }));
    expect(legacyServers).toHaveBeenCalled();
  });

  it("refuse sans session avant la résolution", async () => {
    sessionAuth.mockResolvedValue(null as never);
    const response = await getLegacyServers();
    expect(response.status).toBe(401);
    expect(findEnv).not.toHaveBeenCalled();
  });
});
