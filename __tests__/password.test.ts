jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  /**
   * Miroir de la forme Auth.js : le callback métier est dans `options.authorize`,
   * le champ top-level `authorize` est un stub `() => null`.
   * Nécessaire car Jest ne transforme pas le module ESM next-auth/providers/credentials.
   */
  default: (config: { authorize?: unknown }) => ({
    id: "credentials",
    name: "Credentials",
    type: "credentials",
    credentials: {},
    authorize: () => null,
    options: config,
  }),
}));

jest.mock("@/data/user", () => ({
  getUserByNetId: jest.fn(),
}));

import bcrypt from "bcryptjs";
import type { User } from "next-auth";
import authConfig from "@/auth.config";
import { getUserByNetId } from "@/data/user";
import {
  authorizeCredentials,
  mysqlPasswordHash,
  verifyPassword,
} from "@/lib/password";

const mockGetUserByNetId = getUserByNetId as jest.MockedFunction<
  typeof getUserByNetId
>;

/**
 * Récupère la fonction authorize réellement enregistrée par auth.config.ts.
 * Avec next-auth/providers/credentials, le callback fourni est dans
 * `provider.options.authorize` (le champ top-level `authorize` est un stub `() => null`).
 */
function getCredentialsAuthorizeFromAuthConfig(): (
  credentials: unknown,
  request?: unknown
) => Promise<User | null> {
  const providers = authConfig.providers ?? [];
  const provider = providers.find((p) => {
    const candidate = p as { id?: string; type?: string };
    return candidate.id === "credentials" || candidate.type === "credentials";
  }) as
    | {
        authorize?: (
          credentials: unknown,
          request?: unknown
        ) => Promise<User | null>;
        options?: {
          authorize?: (
            credentials: unknown,
            request?: unknown
          ) => Promise<User | null>;
        };
      }
    | undefined;

  if (!provider) {
    throw new Error("Provider Credentials introuvable dans auth.config.ts");
  }

  // Auth.js stocke le callback métier dans options.authorize ;
  // le champ top-level authorize est un stub `() => null`.
  const authorize = provider.options?.authorize ?? provider.authorize;
  if (typeof authorize !== "function") {
    throw new Error(
      "Fonction authorize introuvable sur le provider Credentials"
    );
  }

  return authorize;
}

describe("mysqlPasswordHash (legacy MySQL PASSWORD 4.1+)", () => {
  it("produit * + 40 hex majuscules pour des vecteurs synthétiques", () => {
    expect(mysqlPasswordHash("test")).toBe(
      "*94BDCEBE19083CE2A1F959FD02F964C7AF4CFC29"
    );
    expect(mysqlPasswordHash("password")).toBe(
      "*2470C0C06DEE42FD1618BB99005ADCA2EC9D1E19"
    );
    expect(mysqlPasswordHash("Test123!")).toBe(
      "*48B1BB7AD34484EF0632D4B9A748CC861DFBE88B"
    );
    expect(mysqlPasswordHash("test")).toHaveLength(41);
    expect(mysqlPasswordHash("test")).toMatch(/^\*[0-9A-F]{40}$/);
  });
});

describe("verifyPassword", () => {
  const legacyHash = mysqlPasswordHash("test");

  it("legacy + bon mot de passe → true", async () => {
    await expect(verifyPassword("test", legacyHash)).resolves.toBe(true);
  });

  it("legacy + mauvais mot de passe → false", async () => {
    await expect(verifyPassword("wrong", legacyHash)).resolves.toBe(false);
  });

  it("bcrypt + bon → true", async () => {
    const hash = await bcrypt.hash("secret123", 10);
    await expect(verifyPassword("secret123", hash)).resolves.toBe(true);
  });

  it("bcrypt + mauvais → false", async () => {
    const hash = await bcrypt.hash("secret123", 10);
    await expect(verifyPassword("other", hash)).resolves.toBe(false);
  });

  it("bcrypt $2y$ + bon → true (compatibilité bcryptjs)", async () => {
    const hash2a = await bcrypt.hash("secret123", 10);
    const hash2y = hash2a.replace(/^\$2a\$/, "$2y$");
    expect(hash2y.startsWith("$2y$")).toBe(true);
    await expect(verifyPassword("secret123", hash2y)).resolves.toBe(true);
    await expect(verifyPassword("wrong", hash2y)).resolves.toBe(false);
  });

  it("NULL → false", async () => {
    await expect(verifyPassword("test", null)).resolves.toBe(false);
    await expect(verifyPassword(null, legacyHash)).resolves.toBe(false);
  });

  it("chaîne vide → false", async () => {
    await expect(verifyPassword("", legacyHash)).resolves.toBe(false);
    await expect(verifyPassword("test", "")).resolves.toBe(false);
  });

  it("DISABLED_ → false", async () => {
    await expect(
      verifyPassword("test", `DISABLED_${legacyHash}`)
    ).resolves.toBe(false);
    await expect(verifyPassword("x", "DISABLED_anything")).resolves.toBe(
      false
    );
  });

  it("format inconnu → false", async () => {
    await expect(verifyPassword("test", "not-a-hash")).resolves.toBe(false);
    await expect(verifyPassword("test", "plaintext-password")).resolves.toBe(
      false
    );
  });
});

describe("authorizeCredentials", () => {
  const legacyPlain = "password";
  const legacyUser = {
    id: 1,
    netid: "USER1",
    password: mysqlPasswordHash(legacyPlain),
  };

  it("refuse un mauvais mot de passe", async () => {
    const findUser = jest.fn().mockResolvedValue(legacyUser);
    const result = await authorizeCredentials(
      { netid: "USER1", password: "wrong-password" },
      findUser
    );
    expect(result).toBeNull();
    expect(findUser).toHaveBeenCalledWith("USER1");
  });

  it("accepte un bon mot de passe (legacy)", async () => {
    const findUser = jest.fn().mockResolvedValue(legacyUser);
    const result = await authorizeCredentials(
      { netid: "USER1", password: legacyPlain },
      findUser
    );
    expect(result).toEqual(legacyUser);
  });

  it("refuse un utilisateur inexistant", async () => {
    const findUser = jest.fn().mockResolvedValue(null);
    const result = await authorizeCredentials(
      { netid: "NOBODY", password: "test123" },
      findUser
    );
    expect(result).toBeNull();
  });

  it("accepte un bon mot de passe (bcrypt)", async () => {
    const hash = await bcrypt.hash("secret123", 10);
    const user = { id: 2, netid: "USER2", password: hash };
    const findUser = jest.fn().mockResolvedValue(user);
    const result = await authorizeCredentials(
      { netid: "USER2", password: "secret123" },
      findUser
    );
    expect(result).toEqual(user);
  });
});

describe("auth.config Credentials authorize (anti-régression)", () => {
  const legacyPlain = "password";
  const legacyUser = {
    id: 42,
    netid: "AUTHCFG1",
    password: mysqlPasswordHash(legacyPlain),
  };

  beforeEach(() => {
    mockGetUserByNetId.mockReset();
  });

  it("utilisateur existant + mauvais mot de passe legacy → null", async () => {
    mockGetUserByNetId.mockResolvedValue(legacyUser as never);
    const authorize = getCredentialsAuthorizeFromAuthConfig();

    const result = await authorize({
      netid: "AUTHCFG1",
      password: "wrong-password",
    });

    expect(result).toBeNull();
    expect(mockGetUserByNetId).toHaveBeenCalledWith("AUTHCFG1");
  });

  it("utilisateur existant + bon mot de passe legacy → utilisateur", async () => {
    mockGetUserByNetId.mockResolvedValue(legacyUser as never);
    const authorize = getCredentialsAuthorizeFromAuthConfig();

    const result = await authorize({
      netid: "AUTHCFG1",
      password: legacyPlain,
    });

    expect(result).toEqual(legacyUser);
    expect(mockGetUserByNetId).toHaveBeenCalledWith("AUTHCFG1");
  });
});
