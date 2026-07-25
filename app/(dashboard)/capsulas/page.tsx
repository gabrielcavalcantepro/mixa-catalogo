import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { criarCapsula } from "./_actions/capsula-actions";
import { listarCapsulas } from "./_queries/listar-capsulas";
import { CapsulaForm } from "./_components/capsula-form";
import { CapsulaEditarDialog } from "./_components/capsula-editar-dialog";
import { CapsulaExcluirButton } from "./_components/capsula-excluir-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CapsulasPage() {
  const capsulas = await listarCapsulas();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-3xl">Cápsulas</h1>
        <p className="text-muted-foreground">
          Coleções/lançamentos aos quais as peças pertencem. A cápsula de um
          look é sempre derivada automaticamente — a mais recente entre as
          peças que o compõem.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg not-italic font-sans">
            Nova cápsula
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CapsulaForm action={criarCapsula} textoBotao="Criar cápsula" />
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Lançamento</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {capsulas.map((capsula) => (
            <TableRow key={capsula.id}>
              <TableCell className="font-medium">{capsula.nome}</TableCell>
              <TableCell className="text-muted-foreground">
                {format(capsula.dataLancamento, "d 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell className="flex justify-end gap-2">
                <CapsulaEditarDialog capsula={capsula} />
                <CapsulaExcluirButton id={capsula.id} nome={capsula.nome} />
              </TableCell>
            </TableRow>
          ))}
          {capsulas.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Nenhuma cápsula cadastrada ainda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
