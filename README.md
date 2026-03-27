# Fenix Search

Aplicação Next.js para consultas de dados empresariais e pessoais via API [Kipflow](https://docs.kipflow.io/).

## Funcionalidades

- **Empresa por CNPJ** – Dados cadastrais e datasets selecionáveis; exportação Excel
- **Busca avançada** – Filtros por situação, UF, município, razão social
- **Consulta CPF** – Dados de pessoa física
- **Telefones** – Busca telefones de empresa por CNPJ ou domínio
- **Emails** – Geração de emails a partir de perfis LinkedIn

## Configuração

1. Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env.local
   ```

2. Adicione sua API Key do Kipflow em `.env.local`:
   ```
   KIPFLOW_API_KEY=sua_chave_aqui
   ```

3. Obtenha sua chave em [platform.kipflow.io](https://platform.kipflow.io).

## Execução

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## API Base

Por padrão, a aplicação usa `https://api.kipflow.io`. Para alterar a base URL:

```
KIPFLOW_BASE_URL=https://sua-url.com
```
