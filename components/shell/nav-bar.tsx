import Link from "next/link";
import { sair } from "./actions";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/pecas", label: "Peças" },
  { href: "/looks", label: "Looks" },
  { href: "/sugestoes-de-look", label: "Sugestões" },
  { href: "/perfis-de-estilo", label: "Perfis de estilo" },
  { href: "/capsulas", label: "Cápsulas" },
];

export function NavBar({ nomeUsuario }: { nomeUsuario: string }) {
  return (
    <header className="border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <span className="font-heading text-xl italic">Mixa</span>
          <nav className="flex gap-6 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">{nomeUsuario}</span>
          <form action={sair}>
            <Button variant="ghost" size="sm" type="submit">
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
