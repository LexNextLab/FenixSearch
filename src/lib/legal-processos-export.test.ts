/**
 * Testes offline da exportação de processos (ano da distribuição e colunas de polo).
 * Não chama rede nem API.
 *
 * Rodar: npm run test:export
 */
import assert from "node:assert/strict";
import type { LegalProcessoItem } from "@/lib/kipflow";
import {
  formatDataDistribuicaoAno,
  formatPolosPrincipaisFromPartes,
  processoToCsvRow,
} from "@/lib/legal-processos-export";
import { PROCESSO_COL_PT } from "@/lib/empresa-excel-labels";

// --- formatDataDistribuicaoAno
assert.equal(formatDataDistribuicaoAno(undefined), "");
assert.equal(formatDataDistribuicaoAno(""), "");
assert.equal(formatDataDistribuicaoAno("2024-03-15T12:00:00.000Z"), "2024");
assert.equal(formatDataDistribuicaoAno("Distribuído em 15/03/2026"), "2026");

// --- formatPolosPrincipaisFromPartes (ordem e "; "; PASSIVO antes de ATIVO na string)
const partesExemplo: LegalProcessoItem["partes"] = [
  { tipo: "REQUERENTE", nome: "SAGRES FOOD LTDA", polo: "ATIVO" },
  { tipo: "REQUERENTE", nome: "SAMUEL MARCOS PEDROSO", polo: "ATIVO" },
  { tipo: "REQUERIDO", nome: "LAR COMERCIO DE PRODUTOS DE HIGIENE", polo: "PASSIVO" },
  { tipo: "REQUERIDO", nome: "MEQSO FRANGO COMERCIO DE PRODUTOS ALIMENTICIOS", polo: "PASSIVO" },
  { tipo: "PERITO", nome: "MARIVAL PAIS", polo: "" },
  { tipo: "REQUERENTE", nome: "SAGRES FOOD LTDA", polo: "ATIVO" },
];

const polos = formatPolosPrincipaisFromPartes(partesExemplo);
assert.equal(polos.poloAtivoPrincipal, "SAGRES FOOD LTDA; SAMUEL MARCOS PEDROSO");
assert.equal(
  polos.poloPassivoPrincipal,
  "LAR COMERCIO DE PRODUTOS DE HIGIENE; MEQSO FRANGO COMERCIO DE PRODUTOS ALIMENTICIOS"
);

// "PASSIVO" não deve ser classificado como ATIVO (substring)
assert.deepEqual(formatPolosPrincipaisFromPartes([{ nome: "X", polo: "PASSIVO" }]), {
  poloAtivoPrincipal: "",
  poloPassivoPrincipal: "X",
});

// --- processoToCsvRow: colunas batem com PROCESSO_COL_PT e ano + polos
const procMin: LegalProcessoItem = {
  numeroProcessoUnico: "00000000000000000000",
  tribunal: "TJSP",
  uf: "SP",
  segmento: "1º Grau",
  dataDistribuicao: "2026-01-10",
  partes: partesExemplo,
};
const row = processoToCsvRow(procMin, "00000000000191");
assert.equal(row.length, PROCESSO_COL_PT.length);
const idxAno = PROCESSO_COL_PT.indexOf("Data da distribuição");
const idxAtivo = PROCESSO_COL_PT.indexOf("POLO ATIVO PRINCIPAL");
const idxPass = PROCESSO_COL_PT.indexOf("POLO PASSIVO PRINCIPAL");
assert.equal(row[idxAno], "2026");
assert.equal(row[idxAtivo], polos.poloAtivoPrincipal);
assert.equal(row[idxPass], polos.poloPassivoPrincipal);

console.log("legal-processos-export: todos os testes passaram.");
