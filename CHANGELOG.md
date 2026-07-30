# Changelog

Todas as mudanças notáveis deste projeto são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere a [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado
- Dockerização completa do stack (`db` + `backend` + `frontend`) via
  `docker-compose.yml`, com `Dockerfile` para backend e frontend e
  `backend/entrypoint.sh` (espera o Postgres, roda migrations, sobe o
  servidor). Agora `docker compose up --build` é suficiente para rodar o
  projeto inteiro sem instalar Python/Node/Postgres na máquina.

### Planejado (Fase 2)
- Gestão de patrimônio por servidor (bens) com conferência e fechamento mensal.
- Relatório de inconformidade de inventário.

### Planejado (Fase 3)
- Gestão de usuários via UI (CRUD completo, hoje só pelo admin do Django).
- Autenticação em dois fatores (2FA/TOTP).
- Auditoria de ações administrativas e logs de acesso.
- Modo manutenção e controle de sessões.
- Alertas por e-mail para solicitações pendentes e ações críticas.
- Exportação de histórico em PDF.

## [0.1.0] - 2026-07-30

### Adicionado
Fase 1 — núcleo do almoxarifado, reescrito do sistema desktop `almox-charl`
(CustomTkinter + SQLite) para uma aplicação web em camadas (Django REST
Framework + React/MUI):

- Estrutura base do backend Django (`config` + apps `core`, `accounts`,
  `colaboradores`, `itens`, `movimentacoes`), com settings separados por
  ambiente (`base`/`dev`/`prod`) e segredos via `.env`.
- Autenticação JWT (SimpleJWT) com papéis de usuário
  (`colaborador`, `administrativo`, `super_administrativo`).
- CRUD de Itens (estoque), com ajuste de estoque separado da edição
  cadastral, bloqueio de exclusão com histórico e importação via CSV.
- CRUD de Colaboradores, com bloqueio de exclusão com histórico e
  importação via CSV.
- Movimentações: registro de Retirada, Empréstimo e Devolução; fluxo de
  aprovação (Pendente/Aprovado/Rejeitado) para itens marcados como
  `requer_aprovacao`; listagem de saldos ativos de empréstimo por
  colaborador; histórico completo com filtros por tipo e status.
- Baixa/estorno de estoque protegidos por `transaction.atomic()` +
  `select_for_update()`, corrigindo a condição de corrida presente no
  `backend.py` original (SQLite sem lock).
- Suíte de testes `pytest-django` cobrindo a camada de `services` (regras
  de negócio) e autenticação/permissões da API.
- Frontend React + Vite + MUI: login, layout com navegação lateral,
  telas de Itens, Colaboradores, Movimentações (com abas) e Histórico.
- `docker-compose.yml` com PostgreSQL para desenvolvimento local.
- Documentação inicial (`README.md`) com arquitetura, setup e roadmap.

### Segurança
- Removidas as credenciais hardcoded do `backend.py` original (SMTP do
  Gmail e senha do Super Admin em texto puro no código-fonte). Segredos
  agora vêm de variáveis de ambiente; o primeiro usuário é criado via
  `python manage.py createsuperuser`.
