import { LoginSchema } from "@/schemas";

describe("LoginSchema", () => {
  it("refuse un netid vide", () => {
    const result = LoginSchema.safeParse({ netid: "", password: "test" });
    expect(result.success).toBe(false);
  });

  it("accepte un netid et un mot de passe valides", () => {
    const result = LoginSchema.safeParse({ netid: "ABC123", password: "secret123" });
    expect(result.success).toBe(true);
  });
});


