import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Layers,
  MapPin,
  Users,
  Scale,
  Globe,
  Gavel,
} from "lucide-react";
import type { CompanyDataset } from "./types";

export type EmpresaDatasetOptionId = CompanyDataset | "processos";

export type EmpresaDatasetOption = {
  id: EmpresaDatasetOptionId;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  /** Dataset enviado à API de empresas; ausente para processos (API jurídica com `q=`). */
  companyDataset?: CompanyDataset;
};

/** Ordem de exibição na consulta (preços só na página Preço DataSets). */
export const EMPRESA_DATASET_OPTIONS: EmpresaDatasetOption[] = [
  {
    id: "basic",
    label: "Básico",
    subtitle: "Dados cadastrais essenciais (Receita Federal)",
    icon: FileText,
    companyDataset: "basic",
  },
  {
    id: "complete",
    label: "Completo",
    subtitle: "CNAE, tributação, faturamento e complementares",
    icon: Layers,
    companyDataset: "complete",
  },
  {
    id: "address",
    label: "Endereço",
    subtitle: "Localização, CEP, coordenadas",
    icon: MapPin,
    companyDataset: "address",
  },
  {
    id: "partners",
    label: "Sócios",
    subtitle: "Quadro societário e qualificações",
    icon: Users,
    companyDataset: "partners",
  },
  {
    id: "debts",
    label: "Dívida ativa",
    subtitle: "Dívida ativa da União",
    icon: Scale,
    companyDataset: "debts",
  },
  {
    id: "online_presence",
    label: "Presença online",
    subtitle: "Sites, e-mails, telefones e redes sociais",
    icon: Globe,
    companyDataset: "online_presence",
  },
  {
    id: "processos",
    label: "Processos judiciais",
    subtitle: "Consulta jurídica por CNPJ (API com parâmetro q)",
    icon: Gavel,
  },
];

/** Todos os IDs de opção (atalho “Completo”: marca todos os datasets + processos). */
export const EMPRESA_DATASET_ALL_IDS: EmpresaDatasetOptionId[] = EMPRESA_DATASET_OPTIONS.map(
  (o) => o.id
);

export function companyDatasetsFromSelection(
  selectedIds: Set<EmpresaDatasetOptionId>
): CompanyDataset[] {
  return EMPRESA_DATASET_OPTIONS.filter(
    (o) => o.companyDataset && selectedIds.has(o.id)
  ).map((o) => o.companyDataset!);
}
