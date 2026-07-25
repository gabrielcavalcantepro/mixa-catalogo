import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NavBar } from "@/components/shell/nav-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar nomeUsuario={session.user.name ?? session.user.email ?? ""} />
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
