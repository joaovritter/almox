import pytest

from apps.colaboradores import services as colab_services
from apps.core.exceptions import DomainError
from apps.itens import services as item_services
from apps.itens.models import Item

from .. import services
from ..models import Movimentacao


@pytest.mark.django_db
def test_registrar_saida_baixa_estoque_quando_nao_requer_aprovacao():
    item = item_services.criar_item(codigo_item="I1", nome_item="Papel", quantidade_atual=10, tipo=Item.Tipo.ESCRITORIO)
    colaborador = colab_services.criar_colaborador(nome="Maria")

    mov = services.registrar_saida(item_id=item.id, colaborador_id=colaborador.id, quantidade=3)

    item.refresh_from_db()
    assert item.quantidade_atual == 7
    assert mov.status_ti == Movimentacao.Status.APROVADO
    assert mov.tipo_movimento == Movimentacao.Tipo.SAIDA


@pytest.mark.django_db
def test_registrar_saida_estoque_insuficiente_nao_altera_estoque():
    item = item_services.criar_item(codigo_item="I2", nome_item="Toner", quantidade_atual=2, tipo=Item.Tipo.ESCRITORIO)
    colaborador = colab_services.criar_colaborador(nome="Maria")

    with pytest.raises(DomainError):
        services.registrar_saida(item_id=item.id, colaborador_id=colaborador.id, quantidade=5)

    item.refresh_from_db()
    assert item.quantidade_atual == 2


@pytest.mark.django_db
def test_item_que_requer_aprovacao_fica_pendente_sem_baixar_estoque():
    item = item_services.criar_item(
        codigo_item="I3", nome_item="Notebook", quantidade_atual=5, tipo=Item.Tipo.TI, requer_aprovacao=True
    )
    colaborador = colab_services.criar_colaborador(nome="João")

    mov = services.registrar_emprestimo(item_id=item.id, colaborador_id=colaborador.id, quantidade=1)

    item.refresh_from_db()
    assert item.quantidade_atual == 5
    assert mov.status_ti == Movimentacao.Status.PENDENTE


@pytest.mark.django_db
def test_aprovar_movimentacao_pendente_baixa_estoque():
    item = item_services.criar_item(
        codigo_item="I4", nome_item="Monitor", quantidade_atual=3, tipo=Item.Tipo.TI, requer_aprovacao=True
    )
    colaborador = colab_services.criar_colaborador(nome="João")
    mov = services.registrar_emprestimo(item_id=item.id, colaborador_id=colaborador.id, quantidade=2)

    aprovado = services.aprovar_movimentacao(mov.id)

    item.refresh_from_db()
    assert item.quantidade_atual == 1
    assert aprovado.status_ti == Movimentacao.Status.APROVADO


@pytest.mark.django_db
def test_aprovar_movimentacao_com_estoque_insuficiente_falha():
    item = item_services.criar_item(
        codigo_item="I4b", nome_item="Monitor", quantidade_atual=1, tipo=Item.Tipo.TI, requer_aprovacao=True
    )
    colaborador = colab_services.criar_colaborador(nome="João")
    mov = services.registrar_emprestimo(item_id=item.id, colaborador_id=colaborador.id, quantidade=1)

    # Estoque cai para 0 por outro motivo antes da aprovação.
    item.quantidade_atual = 0
    item.save(update_fields=["quantidade_atual"])

    with pytest.raises(DomainError):
        services.aprovar_movimentacao(mov.id)


@pytest.mark.django_db
def test_rejeitar_movimentacao_pendente_impede_aprovacao_posterior():
    item = item_services.criar_item(
        codigo_item="I5", nome_item="Mouse", quantidade_atual=3, tipo=Item.Tipo.TI, requer_aprovacao=True
    )
    colaborador = colab_services.criar_colaborador(nome="João")
    mov = services.registrar_emprestimo(item_id=item.id, colaborador_id=colaborador.id, quantidade=1)

    rejeitado = services.rejeitar_movimentacao(mov.id)

    assert rejeitado.status_ti == Movimentacao.Status.REJEITADO
    with pytest.raises(DomainError):
        services.aprovar_movimentacao(mov.id)


@pytest.mark.django_db
def test_aprovar_ou_rejeitar_movimentacao_inexistente_falha():
    with pytest.raises(DomainError):
        services.aprovar_movimentacao(999)
    with pytest.raises(DomainError):
        services.rejeitar_movimentacao(999)


@pytest.mark.django_db
def test_devolucao_incrementa_estoque_e_zera_saldo_ativo():
    item = item_services.criar_item(
        codigo_item="I6", nome_item="Cabo HDMI", quantidade_atual=5, tipo=Item.Tipo.TI, requer_aprovacao=True
    )
    colaborador = colab_services.criar_colaborador(nome="Ana")
    mov = services.registrar_emprestimo(item_id=item.id, colaborador_id=colaborador.id, quantidade=2)
    services.aprovar_movimentacao(mov.id)

    saldos = services.listar_saidas_ativas_por_colaborador(colaborador.id)
    assert len(saldos) == 1
    assert saldos[0]["saldo"] == 2

    services.registrar_devolucao(item_id=item.id, colaborador_id=colaborador.id, quantidade=2)

    item.refresh_from_db()
    assert item.quantidade_atual == 5
    assert services.listar_saidas_ativas_por_colaborador(colaborador.id) == []


@pytest.mark.django_db
def test_devolucao_parcial_mantem_saldo_restante():
    item = item_services.criar_item(
        codigo_item="I7", nome_item="Teclado", quantidade_atual=5, tipo=Item.Tipo.TI, requer_aprovacao=True
    )
    colaborador = colab_services.criar_colaborador(nome="Ana")
    mov = services.registrar_emprestimo(item_id=item.id, colaborador_id=colaborador.id, quantidade=3)
    services.aprovar_movimentacao(mov.id)

    services.registrar_devolucao(item_id=item.id, colaborador_id=colaborador.id, quantidade=1)

    saldos = services.listar_saidas_ativas_por_colaborador(colaborador.id)
    assert saldos[0]["saldo"] == 2


@pytest.mark.django_db
def test_quantidade_zero_ou_negativa_e_rejeitada():
    item = item_services.criar_item(codigo_item="I8", nome_item="Papel", quantidade_atual=10, tipo=Item.Tipo.ESCRITORIO)
    colaborador = colab_services.criar_colaborador(nome="Maria")

    with pytest.raises(DomainError):
        services.registrar_saida(item_id=item.id, colaborador_id=colaborador.id, quantidade=0)
