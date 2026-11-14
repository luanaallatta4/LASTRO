# Lastro · CITi

Sistema que compara o que o CITi vendeu com o que está sendo conversado nas reuniões. Ele avisa quando o cliente pede algo fora do contrato, quando a equipe muda o combinado ou quando um item está sendo esquecido, e estima horas e valor de cada pedido extra.

## Como o projeto está organizado

| Arquivo | O que é |
|---|---|
| `index.html` | O site inteiro (telas, lógica e estilos) |
| `config.js` | Endereço e chave pública do Supabase |
| `api/ia.js` | Função do servidor que chama a IA (Claude) com a chave secreta |
| `supabase.sql` | Cria a tabela, as regras de acesso e 4 projetos de exemplo |

Tecnologias: HTML, CSS e JavaScript no navegador; Supabase para login e banco de dados; Vercel para hospedar o site e a função do servidor; IA do Google Gemini (ou Claude) para a análise; pdf.js e mammoth para ler PDF e Word; Web Speech API para o ditado por voz.

## Passo a passo para colocar no ar

### 1. Banco de dados e login (Supabase)
1. Crie uma conta em supabase.com e clique em **New project**.
2. No menu lateral, abra **SQL Editor**, clique em **New query**, cole todo o conteúdo de `supabase.sql` e clique em **Run**.
3. Abra **Project Settings > API** e copie a **Project URL** e a chave **anon public**.
4. Cole os dois valores no arquivo `config.js`.

### 2. Chave da IA (gratuita, pelo Google Gemini)
1. Entre em aistudio.google.com com uma conta Google.
2. Clique em **Get API key** e depois em **Create API key**.
3. Copie a chave e guarde. Ela é secreta: não coloque em nenhum arquivo do projeto.

O plano gratuito do Gemini não pede cartão. Ele tem um limite de análises por minuto e por dia, suficiente para a demonstração. No plano gratuito, o Google pode usar os textos enviados para melhorar os produtos dele, então não envie dados confidenciais de clientes reais.

Se preferir usar o Claude (pago por uso), crie uma chave em platform.claude.com e use a variável `ANTHROPIC_API_KEY` no lugar de `GEMINI_API_KEY`.

### 3. Repositório (GitHub)
1. Crie um repositório novo em github.com.
2. Envie todos os arquivos desta pasta (dá para arrastar pelo próprio site do GitHub em **Add file > Upload files**).

### 4. Publicação (Vercel)
1. Crie uma conta em vercel.com entrando com o GitHub.
2. Clique em **Add New > Project** e importe o repositório.
3. Em **Environment Variables**, adicione:
   - `GEMINI_API_KEY`: a chave do Google AI Studio
4. Clique em **Deploy**. Em cerca de um minuto o site estará em um endereço como `lastro.vercel.app`.
5. Depois do primeiro deploy, volte em **Environment Variables**, adicione `SITE_URL` com o endereço do site (por exemplo `https://lastro.vercel.app`) e faça **Redeploy**. Assim a IA só responde a pedidos feitos pelo próprio site.
6. Opcional: para usar um domínio próprio, vá em **Settings > Domains**.

### 5. Teste
Clique em **Entrar** (no modo demonstração não é preciso preencher e-mail e senha), abra o projeto App Academia Fit+, envie uma reunião em que o cliente pede algo novo e veja o pedido aparecer no placar.

## Modo demonstração e segurança
- A tela de login está pronta, mas nesta versão qualquer pessoa entra clicando em **Entrar**, para que a avaliação seja simples. Na versão de uso real no CITi, o acesso passa a exigir e-mail e senha cadastrados no Supabase.
- A chave da IA fica apenas nas variáveis da Vercel, nunca no navegador.
- A função `api/ia.js` aceita apenas pedidos vindos do próprio site (variável `SITE_URL`), e o plano gratuito do Gemini não gera cobrança.
- Pelo site não é possível apagar projetos.
