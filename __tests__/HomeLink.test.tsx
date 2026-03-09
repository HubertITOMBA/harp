import { render, screen, fireEvent } from "@testing-library/react";
import { HomeLink } from "@/components/home/HomeLink";

// Mocks partagés du router Next.js
const push = jest.fn();
const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
}));

describe("HomeLink component", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
  });

  it("affiche le texte Accueil par défaut", () => {
    render(<HomeLink />);
    expect(screen.getByText("Accueil")).toBeInTheDocument();
  });

  it("navigue vers /home au clic", () => {
    render(<HomeLink />);
    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(push).toHaveBeenCalledWith("/home");
  });
});


