"""Camada de regras de negócio de Colaboradores.

Reimplementação das funções equivalentes do ``backend.py`` do charl
(``cadastrar_colaborador``, ``remover_colaborador``,
``importar_colaboradores_csv``), agora usando o ORM do Django e levantando
``DomainError`` em vez de retornar tuplas ``(bool, str)``.
"""
import csv
import io
from dataclasses import dataclass, field

from django.db import transaction

from apps.core.exceptions import DomainError

from .models import Colaborador

REQUIRED_CSV_COLUMNS = {"nome_colaborador", "setor", "matricula"}


def criar_colaborador(*, nome: str, setor: str = "", matricula: str = "") -> Colaborador:
    return Colaborador.objects.create(nome=nome, setor=setor, matricula=matricula)


def atualizar_colaborador(
    colaborador: Colaborador, *, nome: str | None = None, setor: str | None = None, matricula: str | None = None
) -> Colaborador:
    if nome is not None:
        colaborador.nome = nome
    if setor is not None:
        colaborador.setor = setor
    if matricula is not None:
        colaborador.matricula = matricula
    colaborador.save()
    return colaborador


def remover_colaborador(colaborador: Colaborador) -> None:
    """Bloqueia a exclusão se houver histórico de movimentação (mesma regra do charl)."""
    if colaborador.movimentacoes.exists():
        raise DomainError("Impossível excluir: o colaborador possui histórico de movimentação.")
    colaborador.delete()


@dataclass
class ImportResult:
    sucessos: int
    falhas: list = field(default_factory=list)


def importar_colaboradores_csv(arquivo) -> ImportResult:
    """Importa colaboradores de um CSV com colunas nome_colaborador,setor,matricula."""
    texto = io.TextIOWrapper(arquivo.file, encoding="utf-8-sig")
    amostra = texto.read(4096)
    texto.seek(0)
    delimitador = ";" if amostra.count(";") >= amostra.count(",") else ","
    leitor = csv.DictReader(texto, delimiter=delimitador)

    colunas = {c.strip().lower() for c in (leitor.fieldnames or [])}
    faltando = REQUIRED_CSV_COLUMNS - colunas
    if faltando:
        raise DomainError(
            f"O CSV deve conter as colunas: {', '.join(sorted(REQUIRED_CSV_COLUMNS))}. "
            f"Faltando: {', '.join(sorted(faltando))}."
        )

    sucessos = 0
    falhas: list = []
    with transaction.atomic():
        for indice, linha in enumerate(leitor, start=2):
            linha = {k.strip().lower(): (v or "").strip() for k, v in linha.items()}
            nome = linha.get("nome_colaborador", "")
            setor = linha.get("setor", "")
            matricula = linha.get("matricula", "")
            if not nome:
                falhas.append(f"Linha {indice}: nome_colaborador vazio.")
                continue
            criar_colaborador(nome=nome, setor=setor, matricula=matricula)
            sucessos += 1

    return ImportResult(sucessos=sucessos, falhas=falhas)
