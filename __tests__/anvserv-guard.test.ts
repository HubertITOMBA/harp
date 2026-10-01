/**
 * @jest-environment node
 */
import prisma from "@/lib/prisma";
import { canAccessEnvironmentForSession } from "@/lib/environment-access";
import { GET } from "@/app/api/anvserv/route";

jest.mock("@/lib/environment-access", () => ({
  canAccessEnvironmentForSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    harpenvserv: { findMany: jest.fn() },
  },
}));

const access = canAccessEnvironmentForSession as jest.MockedFunction<
  typeof canAccessEnvironmentForSession
>;
const findServers = prisma.harpenvserv.findMany as jest.Mock;

function call(id?: string) {
  return GET(new Request("http://localhost/api/anvserv"), {
    params: Promise.resolve(id == null ? {} : { id }),
  });
}

describe("GET /api/anvserv", () => {
  beforeEach(() => {
    access.mockReset();
    findServers.mockReset();
  });

  it("refuse un appel sans identifiant et ne lit pas les serveurs", async () => {
    const response = await call();
    expect(response.status).toBe(400);
    expect(access).not.toHaveBeenCalled();
    expect(findServers).not.toHaveBeenCalled();
  });

  it("refuse une cible inexistante selon la décision centrale", async () => {
    access.mockResolvedValue(404);
    const response = await call("9");
    expect(response.status).toBe(404);
    expect(findServers).not.toHaveBeenCalled();
  });

  it("refuse une famille interdite même si le scope serait compatible", async () => {
    access.mockResolvedValue(403);
    const response = await call("9");
    expect(response.status).toBe(403);
    expect(access).toHaveBeenCalledWith(9);
    expect(findServers).not.toHaveBeenCalled();
    const body = await response.json();
    expect(body).not.toHaveProperty("ip");
  });

  it("refuse un scope interdit pour une famille autorisée", async () => {
    access.mockResolvedValue(403);
    const response = await call("9");
    expect(response.status).toBe(403);
    expect(findServers).not.toHaveBeenCalled();
  });

  it("refuse un utilisateur sans session", async () => {
    access.mockResolvedValue(401);
    const response = await call("9");
    expect(response.status).toBe(401);
    expect(findServers).not.toHaveBeenCalled();
  });

  it("lit les serveurs seulement si la décision centrale autorise", async () => {
    access.mockResolvedValue(200);
    findServers.mockResolvedValue([{ serverId: 1, harpserve: { ip: "10.0.0.1" } }]);
    const response = await call("9");
    expect(response.status).toBe(200);
    expect(findServers).toHaveBeenCalledWith(
      expect.objectContaining({ where: { envId: 9 } })
    );
    await expect(response.json()).resolves.toEqual([
      { serverId: 1, harpserve: { ip: "10.0.0.1" } },
    ]);
  });
});
