import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/pecas");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-4xl">Mixa</h1>
        <p className="mb-8 text-muted-foreground">
          Catálogo e curadoria — acesso da equipe interna
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
