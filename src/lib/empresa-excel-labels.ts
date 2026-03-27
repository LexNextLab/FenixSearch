import type { CompanyDataset, CompanyDto } from "@/lib/types";

/** Datasets da API + aba opcional de processos judiciais na mesma planilha. */
export type EmpresaExportSheetId = CompanyDataset | "processos";

/** Ordem das abas no Excel (datasets da UI / API + processos opcional). */
export const EXPORT_DATASET_ORDER: EmpresaExportSheetId[] = [
  "basic",
  "complete",
  "address",
  "online_presence",
  "partners",
  "debts",
  "processos",
];

/** Nome da aba (máx. 31 caracteres, sem caracteres inválidos do Excel). */
export const DATASET_SHEET_NAME: Record<EmpresaExportSheetId, string> = {
  basic: "Básico",
  complete: "Completo",
  address: "Endereço",
  online_presence: "Presença online",
  partners: "Sócios",
  debts: "Dívida ativa",
  processos: "Processos",
};

/** Rótulos em português para campos escalares da API (CompanyDto e totais de dívida). */
export const EMPRESA_CAMPO_PT: Record<string, string> = {
  cnpj: "CNPJ",
  raiz_cnpj: "Raiz do CNPJ",
  dv_cnpj: "Dígito verificador",
  razao_social: "Razão social",
  nome_fantasia: "Nome fantasia",
  situacao_cadastral: "Situação cadastral",
  data_inicio_atividade: "Data de início da atividade",
  natureza_juridica: "Natureza jurídica",
  porte: "Porte",
  empresa_publico_privada: "Empresa público/privada",
  matriz: "Matriz",
  qtde_filiais: "Quantidade de filiais",
  segmento: "Segmento",
  cnae_principal_classe: "CNAE principal — classe",
  cnae_principal_desc_classe: "CNAE principal — descrição da classe",
  cnae_principal_desc_divisao: "CNAE principal — divisão",
  cnae_principal_desc_grupo: "CNAE principal — grupo",
  cnae_principal_desc_secao: "CNAE principal — seção",
  cnae_principal_desc_subclasse: "CNAE principal — subclasse",
  cnae_principal_subclasse: "CNAE principal — código subclasse",
  endereco: "Endereço",
  bairro: "Bairro",
  cep: "CEP",
  municipio: "Município",
  uf: "UF",
  macrorregiao: "Macrorregião",
  lat: "Latitude",
  lon: "Longitude",
  perfil_socioeconomico_bairro_desc: "Perfil socioeconômico do bairro",
  capital_social: "Capital social",
  faturamento: "Faturamento",
  faturamento_grupo: "Faturamento do grupo",
  faixa_faturamento_grupo: "Faixa de faturamento (grupo)",
  faixa_funcionarios_grupo: "Faixa de funcionários (grupo)",
  forma_de_tributacao: "Forma de tributação",
  forma_de_tributacao_ajustada: "Forma de tributação (ajustada)",
  opcao_pelo_simples: "Opção pelo Simples",
  opcao_pelo_mei: "Opção pelo MEI",
  aliquota_percentual_rat: "Alíquota RAT (%)",
  possui_pat: "Possui PAT",
  qtde_beneficiarios_pat: "Quantidade de beneficiários PAT",
  qtde_registros_inpi: "Quantidade de registros INPI",
  linkedin_url: "LinkedIn (URL)",
  twitter: "Twitter (URL)",
  divida_total: "Dívida — total consolidado",
  divida_total_previdenciaria: "Dívida — total previdenciária",
  divida_total_nao_previdenciaria: "Dívida — total não previdenciária",
  divida_total_fgts: "Dívida — total FGTS",
};

export const TELEFONE_COL_PT = ["Telefone completo", "WhatsApp", "Fixo ou móvel"] as const;
export const SITE_COL_PT = ["Site"] as const;
export const EMAIL_COL_PT = ["Nome", "E-mail"] as const;
export const REDE_COL_PT = ["Rede social", "URL ou perfil"] as const;
export const CNAE_SEC_COL_PT = [
  "Classe",
  "Descrição da classe",
  "Descrição da subclasse",
  "Divisão",
  "Grupo",
  "Seção",
  "Subclasse",
  "Ramo de atividade",
  "Segmento",
] as const;

export const SOCIO_COL_PT = [
  "Nome do sócio",
  "Nome com CNPJ/CPF",
  "Qualificação do sócio",
  "Data de entrada na sociedade",
  "Faixa etária do sócio",
  "Sexo",
  "CPF",
  "CNPJ/CPF do sócio",
  "Qualificação do representante legal",
] as const;

export const DIVIDA_ITEM_COL_PT = [
  "Nome do devedor",
  "Valor consolidado",
  "Tipo de dívida",
  "Data de inscrição",
  "Situação da inscrição",
  "Número da inscrição",
  "UF do devedor",
  "Receita principal",
  "Tipo de devedor",
  "Tipo de pessoa",
  "Indicador ajuizado",
] as const;

/** Cabeçalhos em português (mesma ordem que `processoToCsvRow`). */
export const PROCESSO_COL_PT = [
  "Número do processo",
  "Tribunal",
  "UF",
  "Segmento / instância",
  "Data da distribuição",
  "Valor da causa",
  "Assunto",
  "Classe processual",
  "Juiz",
  "Órgão julgador",
  "URL do processo",
  "Polo da empresa",
  "Área",
  "Status do processo",
  "Data de arquivamento",
  "Ramo do direito",
  "Partes",
] as const;

export const BASIC_KEYS = [
  "cnpj",
  "raiz_cnpj",
  "dv_cnpj",
  "razao_social",
  "nome_fantasia",
  "situacao_cadastral",
  "data_inicio_atividade",
  "natureza_juridica",
  "porte",
  "empresa_publico_privada",
  "matriz",
  "qtde_filiais",
] as const satisfies readonly (keyof CompanyDto)[];

export const COMPLETE_KEYS = [
  "segmento",
  "cnae_principal_classe",
  "cnae_principal_desc_classe",
  "cnae_principal_desc_divisao",
  "cnae_principal_desc_grupo",
  "cnae_principal_desc_secao",
  "cnae_principal_desc_subclasse",
  "cnae_principal_subclasse",
  "capital_social",
  "faturamento",
  "faturamento_grupo",
  "faixa_faturamento_grupo",
  "faixa_funcionarios_grupo",
  "forma_de_tributacao",
  "forma_de_tributacao_ajustada",
  "opcao_pelo_simples",
  "opcao_pelo_mei",
  "aliquota_percentual_rat",
  "possui_pat",
  "qtde_beneficiarios_pat",
  "qtde_registros_inpi",
] as const satisfies readonly (keyof CompanyDto)[];

export const ADDRESS_KEYS = [
  "endereco",
  "bairro",
  "cep",
  "municipio",
  "uf",
  "macrorregiao",
  "lat",
  "lon",
  "perfil_socioeconomico_bairro_desc",
] as const satisfies readonly (keyof CompanyDto)[];
