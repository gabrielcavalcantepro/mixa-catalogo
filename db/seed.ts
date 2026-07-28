import bcrypt from "bcryptjs";
import { db } from "./index";
import { capsulas, perfisEstilo, usuarios } from "./schema";

async function seed() {
  const email = process.env.SEED_USER_EMAIL ?? "founder@mixa.com";
  const senha = process.env.SEED_USER_PASSWORD ?? "mudeisso123";
  const nome = process.env.SEED_USER_NOME ?? "Founder Mixa";

  const senhaHash = await bcrypt.hash(senha, 10);
  await db
    .insert(usuarios)
    .values({ nome, email, senhaHash, role: "founder" })
    .onConflictDoNothing({ target: usuarios.email });

  await db
    .insert(perfisEstilo)
    .values([
      { nome: "Esportivo" },
      { nome: "Tradicional" },
      { nome: "Elegante" },
      { nome: "Romântico" },
      { nome: "Criativo" },
      { nome: "Sexy" },
      { nome: "Dramático urbano" },
    ])
    .onConflictDoNothing({ target: perfisEstilo.nome });

  await db
    .insert(capsulas)
    .values([
      { nome: "Verão 2026", dataLancamento: new Date("2026-01-15") },
      { nome: "Inverno 2025", dataLancamento: new Date("2025-06-01") },
    ])
    .onConflictDoNothing({ target: capsulas.nome });

  console.log(`Seed concluído. Login: ${email} / ${senha}`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });
