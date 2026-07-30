"""Camada de regras de negócio de Movimentações.

Reimplementação das funções equivalentes do ``backend.py`` do charl
(``registrar_saida``, ``registrar_devolucao``, ``aprovar_movimentacao``,
``rejeitar_movimentacao``, ``buscar_saidas_ativas_por_colaborador``), com
duas melhorias sobre o original:

1. ``transaction.atomic()`` + ``select_for_update()`` no Item ao dar baixa
   de estoque, evitando a condição de corrida existente no SQLite cru do
   charl quando duas requisições concorrentes mexem no mesmo item.
2. Erros de regra de negócio levantam ``DomainError`` em vez de retornar
   tuplas ``(bool, str)``.
"""
from django.db import transaction
from django.db.models import Sum

from apps.core.exceptions import DomainError
from apps.itens.models import Item

from .models import Movimentacao


def _registrar_saida_ou_emprestimo(
    *, item_id: int, colaborador_id: int, quantidade: int, tipo_movimento: str, usuario
) -> Movimentacao:
    if quantidade <= 0:
        raise DomainError("A quantidade deve ser maior que zero.")

    with transaction.atomic():
        try:
            item = Item.objects.select_for_update().get(pk=item_id)
        except Item.DoesNotExist as exc:
            raise DomainError("Item não encontrado.") from exc

        if item.requer_aprovacao:
            status_ti = Movimentacao.Status.PENDENTE
        else:
            if quantidade > item.quantidade_atual:
                raise DomainError("Estoque insuficiente para esta operação.")
            item.quantidade_atual -= quantidade
            item.save(update_fields=["quantidade_atual"])
            status_ti = Movimentacao.Status.APROVADO

        movimentacao = Movimentacao.objects.create(
            item_id=item_id,
            colaborador_id=colaborador_id,
            quantidade=quantidade,
            tipo_movimento=tipo_movimento,
            status_ti=status_ti,
            criado_por=usuario if getattr(usuario, "is_authenticated", False) else None,
        )
    return movimentacao


def registrar_saida(*, item_id: int, colaborador_id: int, quantidade: int, usuario=None) -> Movimentacao:
    return _registrar_saida_ou_emprestimo(
        item_id=item_id,
        colaborador_id=colaborador_id,
        quantidade=quantidade,
        tipo_movimento=Movimentacao.Tipo.SAIDA,
        usuario=usuario,
    )


def registrar_emprestimo(*, item_id: int, colaborador_id: int, quantidade: int, usuario=None) -> Movimentacao:
    return _registrar_saida_ou_emprestimo(
        item_id=item_id,
        colaborador_id=colaborador_id,
        quantidade=quantidade,
        tipo_movimento=Movimentacao.Tipo.EMPRESTIMO,
        usuario=usuario,
    )


def registrar_devolucao(*, item_id: int, colaborador_id: int, quantidade: int, usuario=None) -> Movimentacao:
    if quantidade <= 0:
        raise DomainError("A quantidade deve ser maior que zero.")

    with transaction.atomic():
        try:
            item = Item.objects.select_for_update().get(pk=item_id)
        except Item.DoesNotExist as exc:
            raise DomainError("Item não encontrado.") from exc

        item.quantidade_atual += quantidade
        item.save(update_fields=["quantidade_atual"])

        movimentacao = Movimentacao.objects.create(
            item_id=item_id,
            colaborador_id=colaborador_id,
            quantidade=quantidade,
            tipo_movimento=Movimentacao.Tipo.DEVOLUCAO,
            status_ti=Movimentacao.Status.CONCLUIDO,
            criado_por=usuario if getattr(usuario, "is_authenticated", False) else None,
        )
    return movimentacao


def aprovar_movimentacao(movimentacao_id) -> Movimentacao:
    """Aprova uma solicitação Pendente, dando baixa no estoque (reverifica disponibilidade)."""
    with transaction.atomic():
        try:
            movimentacao = Movimentacao.objects.select_for_update().get(
                pk=movimentacao_id, status_ti=Movimentacao.Status.PENDENTE
            )
        except Movimentacao.DoesNotExist as exc:
            raise DomainError("Movimentação não encontrada ou já foi processada.") from exc

        item = Item.objects.select_for_update().get(pk=movimentacao.item_id)
        if movimentacao.quantidade > item.quantidade_atual:
            raise DomainError("Estoque insuficiente para aprovação.")

        item.quantidade_atual -= movimentacao.quantidade
        item.save(update_fields=["quantidade_atual"])

        movimentacao.status_ti = Movimentacao.Status.APROVADO
        movimentacao.save(update_fields=["status_ti"])
    return movimentacao


def rejeitar_movimentacao(movimentacao_id) -> Movimentacao:
    """Rejeita uma solicitação Pendente, sem tocar no estoque."""
    updated = Movimentacao.objects.filter(pk=movimentacao_id, status_ti=Movimentacao.Status.PENDENTE).update(
        status_ti=Movimentacao.Status.REJEITADO
    )
    if not updated:
        raise DomainError("Movimentação não encontrada ou já foi processada.")
    return Movimentacao.objects.get(pk=movimentacao_id)


def listar_saidas_ativas_por_colaborador(colaborador_id) -> list[dict]:
    """Saldo de empréstimos aprovados ainda não devolvidos, por item.

    Equivalente a ``buscar_saidas_ativas_por_colaborador`` do charl: usado
    para popular a lista de itens que um colaborador pode devolver.
    """
    emprestimos = (
        Movimentacao.objects.filter(
            colaborador_id=colaborador_id,
            tipo_movimento=Movimentacao.Tipo.EMPRESTIMO,
            status_ti=Movimentacao.Status.APROVADO,
        )
        .select_related("item")
        .order_by("-data_hora")
    )

    devolvido_por_item = dict(
        Movimentacao.objects.filter(
            colaborador_id=colaborador_id, tipo_movimento=Movimentacao.Tipo.DEVOLUCAO
        )
        .values("item_id")
        .annotate(total=Sum("quantidade"))
        .values_list("item_id", "total")
    )

    saldo_por_item: dict[int, int] = {}
    representante_por_item: dict[int, Movimentacao] = {}
    for mov in emprestimos:
        saldo_por_item[mov.item_id] = saldo_por_item.get(mov.item_id, 0) + mov.quantidade
        representante_por_item.setdefault(mov.item_id, mov)

    resultado = []
    for item_id, retirado in saldo_por_item.items():
        saldo = retirado - devolvido_por_item.get(item_id, 0)
        if saldo > 0:
            mov = representante_por_item[item_id]
            resultado.append(
                {
                    "item_id": item_id,
                    "item_nome": mov.item.nome_item,
                    "saldo": saldo,
                    "ultima_movimentacao": mov.data_hora,
                }
            )
    return resultado
