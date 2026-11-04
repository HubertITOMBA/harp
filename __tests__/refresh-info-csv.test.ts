/**
 * @jest-environment node
 */
import { parseCsvLine } from "@/lib/refresh-info-csv";

const FT = "FT-FICTIF";
const EDI = "EDI-O";
const ORA = "ORA-FICTIF";

/**
 * Construit les 28 premières cases fictives, FT_EXPLOIT occupant l'index 28 ensuite.
 */
function prefix(): string[] {
  const fields = Array.from({ length: 28 }, (_, index) => `F${String(index).padStart(2, "0")}`);
  fields[0] = "ENVFICTIF";
  return fields;
}

function line(fields: string[]): string {
  return fields.join(";");
}

describe("parseCsvLine ORAQUERY", () => {
  it("lit un release de 30 champs sans ORAQUERY et sans décaler EDI", () => {
    const parsed = parseCsvLine(line([...prefix(), FT, EDI]), "release");

    expect(parsed).toMatchObject({
      env: "ENVFICTIF",
      pswd_ft_exploit: FT,
      pswd_oraquery: undefined,
      edi: EDI,
    });
  });

  it("ignore un séparateur final sur un release de 31 champs", () => {
    const parsed = parseCsvLine(line([...prefix(), FT, EDI, ""]), "release");

    expect(parsed).toMatchObject({
      pswd_ft_exploit: FT,
      pswd_oraquery: undefined,
      edi: EDI,
    });
  });

  it("lit un env historique de 30 champs sans ORAQUERY", () => {
    const parsed = parseCsvLine(line([...prefix(), FT, EDI]), "env");

    expect(parsed).toMatchObject({
      pswd_ft_exploit: FT,
      pswd_oraquery: undefined,
      edi: EDI,
    });
  });

  it("lit un env de 31 champs avec ORAQUERY renseigné", () => {
    const parsed = parseCsvLine(line([...prefix(), FT, ORA, EDI]), "env");

    expect(parsed).toMatchObject({
      pswd_ft_exploit: FT,
      pswd_oraquery: ORA,
      edi: EDI,
    });
    expect(parsed?.edi).not.toBe(ORA);
    expect(parsed?.pswd_ft_exploit).not.toBe(ORA);
  });

  it("conserve une case ORAQUERY vide distincte de l'absence", () => {
    const parsed = parseCsvLine(line([...prefix(), FT, "", EDI]), "env");

    expect(parsed).toMatchObject({
      pswd_ft_exploit: FT,
      pswd_oraquery: "",
      edi: EDI,
    });
  });

  it("conserve le littéral null dans ORAQUERY sans le confondre avec EDI", () => {
    const parsed = parseCsvLine(line([...prefix(), FT, "null", EDI]), "env");

    expect(parsed).toMatchObject({
      pswd_ft_exploit: FT,
      pswd_oraquery: "null",
      edi: EDI,
    });
  });

  it("retire un seul séparateur final sur un env de 32 champs", () => {
    const parsed = parseCsvLine(line([...prefix(), FT, ORA, EDI, ""]), "env");

    expect(parsed).toMatchObject({
      pswd_ft_exploit: FT,
      pswd_oraquery: ORA,
      edi: EDI,
    });
  });

  it("rejette un env de 31 champs dont la dernière case est vide", () => {
    expect(parseCsvLine(line([...prefix(), FT, EDI, ""]), "env")).toBeNull();
  });

  it.each([
    ["release", 29],
    ["release", 32],
    ["env", 29],
    ["env", 33],
  ])("rejette %s avec %i champs", (family, count) => {
    const fields = [...prefix(), FT, EDI];
    while (fields.length < count) {
      fields.push("X");
    }
    expect(parseCsvLine(line(fields.slice(0, count)), family as "env" | "release")).toBeNull();
  });

  it("rejette un release de 31 champs dont la dernière case n'est pas vide", () => {
    expect(parseCsvLine(line([...prefix(), FT, EDI, "X"]), "release")).toBeNull();
  });
});
