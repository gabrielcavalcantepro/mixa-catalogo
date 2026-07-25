import { criarPerfil } from "./_actions/perfil-actions";
import { listarPerfis } from "./_queries/listar-perfis";
import { PerfilForm } from "./_components/perfil-form";
import { PerfilEditarDialog } from "./_components/perfil-editar-dialog";
import { PerfilExcluirButton } from "./_components/perfil-excluir-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function PerfisDeEstiloPage() {
  const perfis = await listarPerfis();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-3xl">Perfis de estilo</h1>
        <p className="text-muted-foreground">
          Perfis que a usuária final vai escolher no onboarding do app. Toda
          peça e todo look referenciam um ou mais destes perfis.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg not-italic font-sans">
            Novo perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PerfilForm action={criarPerfil} textoBotao="Criar perfil" />
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {perfis.map((perfil) => (
            <TableRow key={perfil.id}>
              <TableCell className="font-medium">{perfil.nome}</TableCell>
              <TableCell className="text-muted-foreground">
                {perfil.descricao ?? "—"}
              </TableCell>
              <TableCell className="flex justify-end gap-2">
                <PerfilEditarDialog perfil={perfil} />
                <PerfilExcluirButton id={perfil.id} nome={perfil.nome} />
              </TableCell>
            </TableRow>
          ))}
          {perfis.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Nenhum perfil cadastrado ainda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
