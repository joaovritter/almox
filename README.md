# almox-v1

Sistema de Gestão de Almoxarifado — Gestão do almoxarifado do MPT, com acesso separado por PTM.

## Stack

- **Backend:** Python 3.11+, Django 5, Django REST Framework, SimpleJWT (JWT), PostgreSQL.
- **Frontend:** React 18 + TypeScript, Vite, Material UI, React Router, Axios.
- **Infra local:** Docker Compose (só o PostgreSQL, backend e frontend rodam nativamente para hot-reload rápido).

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
containers  em `docker-compose.yml`.

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

Veja `backend/.env.example` e `frontend/.env.example`.

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
