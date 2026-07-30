# almox-v1

Sistema de Gestão de Almoxarifado — reescrita web (Django + React) do
sistema desktop [`almox-charl`](../almox-charl) (CustomTkinter + SQLite),
mantendo as mesmas regras de negócio, com arquitetura em camadas, testes
automatizados e API REST versionável.

> **Status:** Fase 1 (núcleo do almoxarifado) implementada. Veja
> [Roadmap e paridade de funcionalidades](#roadmap-e-paridade-de-funcionalidades)
> para o que ainda falta em relação ao charl.

## Stack

- **Backend:** Python 3.11+, Django 5, Django REST Framework, SimpleJWT (JWT), PostgreSQL.
- **Frontend:** React 18 + TypeScript, Vite, MUI (Material UI), React Router, Axios.
- **Infra local:** Docker Compose (só o PostgreSQL — backend e frontend rodam nativamente para hot-reload rápido).

## Arquitetura em camadas

O backend é organizado por domínio (`apps/accounts`, `apps/colaboradores`,
`apps/itens`, `apps/movimentacoes`), e cada app segue o mesmo fluxo de
camadas — nunca pule uma camada (ex.: uma view não deve conter regra de
negócio, isso vai em `services.py`):

```
models.py        -> persistência (Django ORM)
services.py       -> regras de negócio (equivalente às funções do backend.py do charl)
serializers.py    -> validação de entrada / representação de saída (DRF)
views.py          -> HTTP: ViewSets que só orquestram serializer + service
permissions.py    -> apps/core/permissions.py (regras de papel compartilhadas)
```

`apps/core` contém o que é transversal a todos os apps: `DomainError` (erro
de regra de negócio → HTTP 400 automático via `custom_exception_handler`),
paginação padrão e permissões de papel (`IsAdminRole`, `IsSuperAdminRole`).

O frontend segue uma separação parecida:

```
api/*.ts              -> chamadas HTTP tipadas (um arquivo por domínio)
auth/                  -> autenticação (contexto, rota protegida, login)
layout/                -> casca da aplicação (sidebar, topbar)
features/<dominio>/    -> páginas e componentes de cada tela
components/            -> componentes compartilhados entre features (diálogos de import CSV, confirmação)
```

Nenhuma regra de negócio vive no frontend — ele só chama a API e trata
estados de carregamento/erro.

## Mapeamento em relação ao charl

| charl (`backend.py`)                          | almox-v1                                                    |
| ----------------------------------------------- | ------------------------------------------------------------- |
| Tabela `Itens` (SQLite)                         | `apps.itens.Item` (Postgres)                                   |
| Tabela `Colaboradores`                          | `apps.colaboradores.Colaborador`                                |
| Tabela `Movimentacoes`                          | `apps.movimentacoes.Movimentacao`                                |
| Tabela `Usuarios` + bcrypt                      | `apps.accounts.User` (Django auth + JWT)                        |
| `registrar_saida` / `registrar_emprestimo`      | `movimentacoes.services.registrar_saida` / `registrar_emprestimo` |
| `aprovar_movimentacao` / `rejeitar_movimentacao`| `movimentacoes.services.aprovar_movimentacao` / `rejeitar_movimentacao` |
| `registrar_devolucao`                           | `movimentacoes.services.registrar_devolucao`                     |
| `buscar_saidas_ativas_por_colaborador`          | `movimentacoes.services.listar_saidas_ativas_por_colaborador`    |
| `importar_itens_csv` / `importar_colaboradores_csv` | `itens.services.importar_itens_csv` / `colaboradores.services.importar_colaboradores_csv` |

**Melhorias sobre o original:**

- Baixa de estoque protegida por `transaction.atomic()` + `select_for_update()`
  (o charl usava SQLite cru sem lock, sujeito a condição de corrida entre
  requisições concorrentes).
- Sem credenciais de e-mail/SMTP nem senha de superusuário hardcoded no
  código-fonte (o `backend.py` original tinha usuário/senha do Gmail e a
  senha do Super Admin em texto puro). Aqui, segredos vêm de `.env` e o
  primeiro usuário é criado com `createsuperuser`.
- Erros de regra de negócio são uma exceção tipada (`DomainError`) em vez
  de tuplas `(bool, str)` espalhadas pelo código.

## Estrutura do repositório

```
almox-v1/
├── docker-compose.yml     # orquestra db + backend + frontend
├── backend/                # Django + DRF
│   ├── Dockerfile
│   ├── entrypoint.sh         # aguarda o Postgres, roda migrations, sobe o runserver
│   ├── config/                # settings (base/dev/prod), urls, wsgi/asgi
│   └── apps/
│       ├── core/                # exceções, permissões, paginação compartilhadas
│       ├── accounts/             # usuário custom + login JWT
│       ├── colaboradores/
│       ├── itens/
│       └── movimentacoes/
└── frontend/               # React + Vite + MUI
    ├── Dockerfile
    └── src/
        ├── api/, auth/, layout/, components/, features/
```

## Como rodar localmente

**Pré-requisito único: [Docker](https://www.docker.com/) (com Docker Compose).**
Não precisa instalar Python, Node nem Postgres na máquina — tudo roda em
containers definidos em `docker-compose.yml`.

```powershell
docker compose up --build
```

Isso sobe três serviços:

- `db` — PostgreSQL em `localhost:5432`.
- `backend` — Django em `http://localhost:8000`. O `entrypoint.sh` espera o
  banco ficar disponível, roda `makemigrations`/`migrate` automaticamente
  (nunca foram gerados ainda — é a primeira execução deste projeto) e sobe
  o servidor de desenvolvimento.
- `frontend` — Vite em `http://localhost:5173`, com hot-reload (o código
  local é montado dentro do container).

Na primeira vez, crie o usuário administrador em outro terminal, com os
containers já rodando:

```powershell
docker compose exec backend python manage.py createsuperuser
```

Acesse `http://localhost:5173` e faça login com esse usuário. O admin do
Django (útil para inspecionar dados e trocar o `role` de um usuário para
Administrativo/Super_Administrativo) fica em `http://localhost:8000/admin/`.

Para parar tudo: `docker compose down` (os dados do Postgres persistem no
volume `postgres-data`; use `docker compose down -v` para apagá-los também).

### Testes automatizados do backend

```powershell
docker compose exec backend pytest
```

### Alternativa sem Docker

Se preferir rodar nativamente (Python 3.11+ e Node 18+ instalados), os
passos são: `pip install -r backend/requirements.txt` + `manage.py migrate`
+ `runserver` de um lado, `npm install` + `npm run dev` do outro — usando
`backend/.env.example` e `frontend/.env.example` como base para os `.env`
(nesse caso você precisa de um Postgres acessível, ou pode apontar
`DATABASE_URL` para SQLite, que é o padrão caso a variável não seja definida).

Os testes cobrem a camada de `services` (regras de negócio: baixa de
estoque, fluxo de aprovação, bloqueio de exclusão com histórico, import CSV)
e autenticação/permissões da API. Rode `pytest` sempre antes de abrir um PR.

## Variáveis de ambiente

Veja `backend/.env.example` e `frontend/.env.example`. Nunca commite um
`.env` real — ambos já estão no `.gitignore`.

## Roadmap e paridade de funcionalidades

| Funcionalidade do charl                                   | Status no almox-v1        |
| ------------------------------------------------------------ | ---------------------------- |
| Itens (cadastro, edição, ajuste de estoque, exclusão, import CSV) | ✅ Fase 1 |
| Colaboradores (cadastro, edição, exclusão, import CSV)     | ✅ Fase 1 |
| Movimentações: Retirada / Empréstimo / Devolução / Pendentes / Aprovar / Rejeitar | ✅ Fase 1 |
| Histórico de movimentações com filtros                     | ✅ Fase 1 |
| Login com papéis (Colaborador/Administrativo/Super_Administrativo) | ✅ Fase 1 (via JWT) |
| Patrimônio por servidor + conferência/fechamento mensal + relatório de inconformidade | ⏳ Fase 2 |
| Gestão de usuários via UI (hoje só pelo admin do Django)    | ⏳ Fase 3 |
| 2FA (TOTP)                                                  | ⏳ Fase 3 |
| Auditoria (`Auditoria`) e logs de acesso (`LogsAcesso`)     | ⏳ Fase 3 |
| Sessões (`Sessoes`) e modo manutenção                       | ⏳ Fase 3 |
| Alertas por e-mail                                          | ⏳ Fase 3 |
| Exportação de histórico em PDF                              | ⏳ Fase 3 |

## Contribuindo

Antes de abrir um PR: rode `pytest` no backend, confira `npm run build` no
frontend, e registre a mudança em [`CHANGELOG.md`](./CHANGELOG.md) seguindo
o formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).
