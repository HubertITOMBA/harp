import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { canAccessTypeEnvForSession } from "@/lib/type-env-access";
import EnvSinglePage from "@/app/(protected)/harp/envs/[id]/page";

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

jest.mock("@/lib/type-env-access", () => ({
  canAccessTypeEnvForSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    harptypenv: { findUnique: jest.fn() },
  },
}));

jest.mock("@/components/harp/ListEnvs", () => ({
  __esModule: true,
  default: function HarpEnvPage(props: { typenvid: number }) {
    return { type: "list", typenvid: props.typenvid };
  },
}));

const access = canAccessTypeEnvForSession as jest.MockedFunction<typeof canAccessTypeEnvForSession>;
const findType = prisma.harptypenv.findUnique as jest.Mock;
const missing = notFound as jest.MockedFunction<typeof notFound>;

function page(id: string) {
  return EnvSinglePage({ params: Promise.resolve({ id }) as unknown as { id: string } });
}

function listTypenvId(element: { props?: { children?: { props?: { typenvid?: number } } } }) {
  return element.props?.children?.props?.typenvid;
}

function isDenied(element: { type?: { name?: string } }) {
  return element.type?.name === "FamilyAccessDenied";
}

describe("page /harp/envs/[id]", () => {
  beforeEach(() => {
    access.mockReset();
    findType.mockReset();
    missing.mockClear();
    findType.mockResolvedValue({ typenvid: 11, typenv: "PRE-PRODUCTION" });
  });

  it("ouvre la pré-production à TMA_LOCAL puis laisse le périmètre à la liste", async () => {
    access.mockResolvedValue(true);
    const element = await page("11");
    expect(access).toHaveBeenCalledWith(11);
    expect(listTypenvId(element as never)).toBe(11);
    expect(findType).toHaveBeenCalled();
  });

  it.each(["13", "19"])("refuse le typenvid %s à TMA_LOCAL avant toute lecture de famille", async (id) => {
    access.mockResolvedValue(false);
    const element = await page(id);
    expect(isDenied(element as never)).toBe(true);
    expect(findType).not.toHaveBeenCalled();
  });

  it.each(["2", "9"])("ouvre le typenvid %s à TMA_OFFSHORE", async (id) => {
    access.mockResolvedValue(true);
    findType.mockResolvedValue({ typenvid: Number(id), typenv: "famille" });
    const element = await page(id);
    expect(listTypenvId(element as never)).toBe(Number(id));
  });

  it("refuse la référence à TMA_OFFSHORE", async () => {
    access.mockResolvedValue(false);
    const element = await page("15");
    expect(isDenied(element as never)).toBe(true);
  });

  it("ouvre la recette et la production à FT-MOE et refuse DRP", async () => {
    access.mockResolvedValueOnce(true).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    findType.mockResolvedValue({ typenvid: 10, typenv: "RECETTE" });
    expect(listTypenvId((await page("10")) as never)).toBe(10);
    findType.mockResolvedValue({ typenvid: 12, typenv: "PRODUCTION" });
    expect(listTypenvId((await page("12")) as never)).toBe(12);
    const denied = await page("13");
    expect(isDenied(denied as never)).toBe(true);
  });

  it("ouvre la pré-production à PSADMIN et à PORTAL_ADMIN", async () => {
    access.mockResolvedValue(true);
    expect(listTypenvId((await page("11")) as never)).toBe(11);
    expect(access).toHaveBeenCalledWith(11);
  });

  it("refuse un utilisateur sans mapping", async () => {
    access.mockResolvedValue(false);
    const element = await page("8");
    expect(isDenied(element as never)).toBe(true);
    expect(findType).not.toHaveBeenCalled();
  });

  it("refuse un typenvid invalide sans interroger le RBAC", async () => {
    await expect(page("0")).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(page("abc")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(access).not.toHaveBeenCalled();
    expect(findType).not.toHaveBeenCalled();
  });
});
