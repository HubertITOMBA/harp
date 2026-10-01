/**
 * @jest-environment node
 */
import prisma from "@/lib/prisma";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { canAccessEnvironmentForSession, authorizeResolvedEnvironment } from "@/lib/environment-access";
import { canAccessTypeEnvForSession } from "@/lib/type-env-access";
import { GET } from "@/app/api/envserv/[id]/route";
import { getServerData } from "@/actions/roleServer";
import { getharpEnv } from "@/actions/harpenvs";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/environment-access", () => ({
  canAccessEnvironmentForSession: jest.fn(),
  authorizeResolvedEnvironment: jest.fn(),
}));

jest.mock("@/lib/type-env-access", () => ({
  canAccessTypeEnvForSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    harpenvserv: { findMany: jest.fn() },
    psadm_typsrv: { findUnique: jest.fn() },
    psadm_env: { findMany: jest.fn() },
  },
}));

jest.mock("@/lib/db", () => ({
  db: {
    envsharp: { findUnique: jest.fn() },
    harpenvserv: { findMany: jest.fn() },
  },
}));

jest.mock("@/data/user", () => ({
  getUserByEmail: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const accessById = canAccessEnvironmentForSession as jest.MockedFunction<typeof canAccessEnvironmentForSession>;
const accessByRow = authorizeResolvedEnvironment as jest.MockedFunction<typeof authorizeResolvedEnvironment>;
const family = canAccessTypeEnvForSession as jest.MockedFunction<typeof canAccessTypeEnvForSession>;
const sessionAuth = auth as jest.MockedFunction<typeof auth>;
const apiServers = prisma.harpenvserv.findMany as jest.Mock;
const legacyEnvs = prisma.psadm_env.findMany as jest.Mock;
const findByName = db.envsharp.findUnique as jest.Mock;
const actionServers = db.harpenvserv.findMany as jest.Mock;

describe("GET /api/envserv/[id]", () => {
  beforeEach(() => {
    accessById.mockReset();
    apiServers.mockReset();
  });

  it("ne lit pas les serveurs si la décision centrale refuse", async () => {
    accessById.mockResolvedValue(403);
    const response = await GET(new Request("http://localhost/api/envserv/9"), {
      params: Promise.resolve({ id: "9" }),
    });
    expect(response.status).toBe(403);
    expect(apiServers).not.toHaveBeenCalled();
  });

  it("refuse un identifiant non numérique", async () => {
    const response = await GET(new Request("http://localhost/api/envserv/abc"), {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(response.status).toBe(400);
    expect(accessById).not.toHaveBeenCalled();
    expect(apiServers).not.toHaveBeenCalled();
  });

  it("lit les serveurs seulement si la décision centrale autorise", async () => {
    accessById.mockResolvedValue(200);
    apiServers.mockResolvedValue([]);
    const response = await GET(new Request("http://localhost/api/envserv/9"), {
      params: Promise.resolve({ id: "9" }),
    });
    expect(response.status).toBe(200);
    expect(accessById).toHaveBeenCalledWith(9);
    expect(apiServers).toHaveBeenCalled();
  });
});

describe("getServerData", () => {
  beforeEach(() => {
    sessionAuth.mockReset();
    accessByRow.mockReset();
    findByName.mockReset();
    actionServers.mockReset();
    sessionAuth.mockResolvedValue({ user: { id: "7" } } as never);
  });

  it("renvoie une liste vide et ne lit pas les serveurs si la décision refuse", async () => {
    findByName.mockResolvedValue({ id: 9, typenvid: 13, scopeId: 41 });
    accessByRow.mockResolvedValue(403);

    await expect(getServerData("ENV13")).resolves.toEqual([]);
    expect(accessByRow).toHaveBeenCalledWith({ id: 9, typenvid: 13, scopeId: 41 });
    expect(actionServers).not.toHaveBeenCalled();
  });

  it("lit les serveurs si la même décision autorise", async () => {
    findByName.mockResolvedValue({ id: 9, typenvid: 11, scopeId: 41 });
    accessByRow.mockResolvedValue(200);
    actionServers.mockResolvedValue([{ id: 1 }]);

    await expect(getServerData("ENV11")).resolves.toEqual([{ id: 1 }]);
    expect(actionServers).toHaveBeenCalled();
  });

  it("renvoie une liste vide sans session et sans lecture", async () => {
    sessionAuth.mockResolvedValue(null as never);
    await expect(getServerData("ENV11")).resolves.toEqual([]);
    expect(findByName).not.toHaveBeenCalled();
    expect(actionServers).not.toHaveBeenCalled();
  });
});

describe("getharpEnv", () => {
  beforeEach(() => {
    family.mockReset();
    legacyEnvs.mockReset();
  });

  it("ne lit pas psadm_env si la famille est refusée", async () => {
    family.mockResolvedValue(false);
    await expect(getharpEnv(13)).resolves.toEqual([]);
    expect(family).toHaveBeenCalledWith(13);
    expect(legacyEnvs).not.toHaveBeenCalled();
  });

  it("refuse un identifiant de famille invalide", async () => {
    await expect(getharpEnv("abc")).resolves.toEqual([]);
    expect(family).not.toHaveBeenCalled();
    expect(legacyEnvs).not.toHaveBeenCalled();
  });

  it("lit psadm_env seulement après une famille autorisée", async () => {
    family.mockResolvedValue(true);
    legacyEnvs.mockResolvedValue([{ env: "A" }]);
    await expect(getharpEnv(11)).resolves.toEqual([{ env: "A" }]);
    expect(family).toHaveBeenCalledWith(11);
    expect(legacyEnvs).toHaveBeenCalled();
  });
});
