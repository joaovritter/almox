"""Camada de regras de negócio de Itens (estoque).

Reimplementação das funções equivalentes do ``backend.py`` do charl
(``cadastrar_item``, ``editar_item_completo``, ``editar_quantidade_estoque``,
``remover_item``, ``importar_itens_csv``).
"""
import csv
import io
from dataclasses import dataclass, field

from django.db import IntegrityError, transaction

from apps.core.exceptions import DomainError

from .models import Item

REQUIRED_CSV_COLUMNS = {"codigo_item", "nome_item", "quantidade_atual", "tipo"}


def criar_item(
    *, codigo_item: str, nome_item: str, quantidade_atual: int, tipo: str, requer_aprovacao: bool = False
) -> Item:
    if Item.objects.filter(codigo_item=codigo_item).exists():
        raise DomainError(f"O código de item '{codigo_item}' já está em uso.")
    return Item.objects.create(
        codigo_item=codigo_item,
        nome_item=nome_item,
        quantidade_atual=quantidade_atual,
        tipo=tipo,
        requer_aprovacao=requer_aprovacao,
    )


def atualizar_item(
    item: Item,
    *,
    codigo_item: str | None = None,
    nome_item: str | None = None,
    tipo: str | None = None,
    requer_aprovacao: bool | None = None,
) -> Item:
    """Edita os dados cadastrais do item. Não altera ``quantidade_atual``
    (mesma separação de responsabilidade do charl: editar_item_completo x
    editar_quantidade_estoque)."""
    if codigo_item is not None:
        item.codigo_item = codigo_item
    if nome_item is not None:
        item.nome_item = nome_item
    if tipo is not None:
        item.tipo = tipo
    if requer_aprovacao is not None:
        item.requer_aprovacao = requer_aprovacao
    try:
        item.save()
    except IntegrityError as exc:
        raise DomainError("O código do item já está em uso.") from exc
    return item


def ajustar_estoque(item: Item, nova_quantidade: int) -> Item:
    if nova_quantidade < 0:
        raise DomainError("A quantidade não pode ser negativa.")
    item.quantidade_atual = nova_quantidade
    item.save(update_fields=["quantidade_atual"])
    return item


def remover_item(item: Item) -> None:
    """Bloqueia a exclusão se houver histórico de movimentação (mesma regra do charl)."""
    if item.movimentacoes.exists():
        raise DomainError("Impossível excluir: o item possui histórico de movimentação.")
    item.delete()


@dataclass
class ImportResult:
    sucessos: int
    falhas: list = field(default_factory=list)


def importar_itens_csv(arquivo) -> ImportResult:
    """Importa itens de um CSV com colunas codigo_item,nome_item,quantidade_atual,tipo."""
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

    tipos_validos = {choice for choice, _ in Item.Tipo.choices}
    sucessos = 0
    falhas: list = []

    with transaction.atomic():
        for indice, linha in enumerate(leitor, start=2):
            linha = {k.strip().lower(): (v or "").strip() for k, v in linha.items()}
            codigo = linha.get("codigo_item", "")
            nome = linha.get("nome_item", "")
            tipo = linha.get("tipo", "")
            qtd_raw = linha.get("quantidade_atual", "")

            if not codigo or not nome or tipo not in tipos_validos:
                falhas.append(f"Linha {indice}: dados inválidos (código, nome ou tipo).")
                continue

            try:
                quantidade = int(qtd_raw)
                if quantidade < 0:
                    raise ValueError
            except ValueError:
                falhas.append(f"Linha {indice}: quantidade inválida ('{qtd_raw}').")
                continue

            if Item.objects.filter(codigo_item=codigo).exists():
                falhas.append(f"Linha {indice}: código '{codigo}' já cadastrado.")
                continue

            Item.objects.create(
                codigo_item=codigo,
                nome_item=nome,
                quantidade_atual=quantidade,
                tipo=tipo,
                requer_aprovacao=(tipo == Item.Tipo.TI),
            )
            sucessos += 1

    return ImportResult(sucessos=sucessos, falhas=falhas)
