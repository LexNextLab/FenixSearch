// DTOs da API Kipflow

export type CompanyDataset =
  | "basic"
  | "complete"
  | "address"
  | "online_presence"
  | "partners"
  | "debts";

export interface AtividadeSecundariaDto {
  classe?: number;
  desc_classe?: string;
  desc_divisao?: string;
  desc_grupo?: string;
  desc_secao?: string;
  desc_subclasse?: string;
  divisao?: number;
  grupo?: number;
  ramo_de_atividade?: string;
  secao?: string;
  segmento?: string;
  subclasse?: number;
}

export interface SiteDto {
  confiabilidade?: number;
  ecommerce?: boolean;
  pertence_contador?: boolean;
  site?: string;
  tecnologias?: string[];
}

export interface SocialMediaDto {
  url?: string;
}

export interface EmailDto {
  email?: string;
  nome?: string;
  pertence_contador?: boolean;
}

export interface TelefoneDto {
  fixo_movel?: string;
  pertence_contador?: boolean;
  score_original?: number;
  telefone_completo?: string;
  validado_discador?: boolean;
  whatsapp?: boolean;
}

export interface SocioDto {
  cnpj_cpf_socio?: string;
  contatos_id?: string;
  cpf?: string;
  data_entrada_sociedade?: string;
  data_nascimento?: string;
  faixa_etaria_socio?: string;
  identificador_socio?: string;
  nome_com_cnpj_cpf?: string;
  nome_socio?: string;
  qualificacao_representante_legal?: string;
  qualificacao_socio?: string;
  sexo?: string;
}

export interface DividaItemDto {
  data_inscricao?: string;
  indicador_ajuizado?: string;
  nome_devedor?: string;
  numero_inscricao?: string;
  receita_principal?: string;
  situacao_inscricao?: string;
  tipo_devedor?: string;
  tipo_divida?: string;
  tipo_pessoa?: string;
  tipo_situacao_inscricao?: string;
  uf_devedor?: string;
  unidade_responsavel?: string;
  valor_consolidado?: number;
}

export interface DividaDto {
  dividas?: DividaItemDto[];
  total?: number;
  total_fgts?: number;
  total_nao_previdenciaria?: number;
  total_previdenciaria?: number;
}

export interface CompanyDto {
  cnpj?: number;
  raiz_cnpj?: number;
  dv_cnpj?: number;
  razao_social?: string;
  nome_fantasia?: string;
  situacao_cadastral?: string;
  data_inicio_atividade?: string;
  natureza_juridica?: string;
  porte?: string;
  empresa_publico_privada?: string;
  matriz?: boolean;
  qtde_filiais?: number;
  segmento?: string;
  cnae_principal_classe?: number;
  cnae_principal_desc_classe?: string;
  cnae_principal_desc_divisao?: string;
  cnae_principal_desc_grupo?: string;
  cnae_principal_desc_secao?: string;
  cnae_principal_desc_subclasse?: string;
  cnae_principal_subclasse?: number;
  atividades_secundarias?: AtividadeSecundariaDto[];
  endereco?: string;
  bairro?: string;
  cep?: number;
  municipio?: string;
  uf?: string;
  macrorregiao?: string;
  lat?: number;
  lon?: number;
  perfil_socioeconomico_bairro_desc?: string;
  capital_social?: number;
  faturamento?: number;
  faturamento_grupo?: number;
  faixa_faturamento_grupo?: string;
  faixa_funcionarios_grupo?: string;
  forma_de_tributacao?: string;
  forma_de_tributacao_ajustada?: string;
  opcao_pelo_simples?: boolean;
  opcao_pelo_mei?: boolean;
  aliquota_percentual_rat?: number;
  possui_pat?: boolean;
  qtde_beneficiarios_pat?: number;
  qtde_registros_inpi?: number;
  sites?: SiteDto[];
  facebook?: SocialMediaDto[];
  instagram?: SocialMediaDto[];
  linkedin_url?: string;
  twitter?: string;
  emails?: EmailDto[];
  telefones?: TelefoneDto[];
  socios?: SocioDto[];
  divida?: DividaDto;
}

export interface CompanySearchResponseDto {
  success: boolean;
  data?: CompanyDto;
  datasets?: string[];
  cost?: number;
  costFormatted?: string;
  error?: ApiErrorDto;
}

export interface CompanyFilterResponseDto {
  success: boolean;
  data?: CompanyDto[];
  /** Datasets efetivamente retornados pela API (quando informado). */
  datasets?: CompanyDataset[] | string[];
  pagination?: { page?: number; size?: number; total?: number };
  cost?: number;
  costFormatted?: string;
}

export interface CompanyFilterRequestDto {
  $filter?: Record<string, unknown>;
  $page?: number;
  $size?: number;
  datasets?: CompanyDataset[];
}

export interface CpfDataDto {
  cpf?: string;
  nome?: string;
  nasc?: string;
  situacao_cadastral?: string;
  data_inscricao?: string;
}

export interface CpfResponseDto {
  success: boolean;
  data?: CpfDataDto;
  datasets?: string[];
  cost?: number;
  costFormatted?: string;
}

export interface PhoneDto {
  fixo_movel?: string;
  pertence_contador?: boolean;
  score_original?: number;
  telefone_completo?: string;
  whatsapp?: boolean;
}

export interface ContactDataDto {
  phones?: PhoneDto[];
}

export interface ContactSearchResponseDto {
  success: boolean;
  data?: ContactDataDto;
  datasets?: string[];
  metadata?: { totalFound?: number; returned?: number; hasMore?: boolean };
}

export interface GeneratedEmailDto {
  full_name?: string;
  email?: string;
  validation?: string;
  seniority?: string;
  area?: string;
}

export interface EmailSearchResponseDto {
  success: boolean;
  data?: GeneratedEmailDto[];
  datasets?: string[];
}

export interface ApiErrorDto {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}
