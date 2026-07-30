import io

import pytest

from apps.core.exceptions import DomainError

from ..models import Item
from .. import services


@pytest.mark.django_db
def test_criar_item():
    item = services.criar_item(
        codigo_item="C1", nome_item="Caneta", quantidade_atual=10, tipo=Item.Tipo.ESCRITORIO
    )
    assert item.pk is not None
    assert item.quantidade_atual == 10
    assert item.requer_aprovacao is False


@pytest.mark.django_db
def test_criar_item_codigo_duplicado_falha():
    services.criar_item(codigo_item="C1", nome_item="Caneta", quantidade_atual=10, tipo=Item.Tipo.ESCRITORIO)
    with pytest.raises(DomainError):
        services.criar_item(codigo_item="C1", nome_item="Outra", quantidade_atual=5, tipo=Item.Tipo.GERAL)


@pytest.mark.django_db
def test_atualizar_item_nao_altera_quantidade():
    item = services.criar_item(codigo_item="C1", nome_item="Caneta", quantidade_atual=10, tipo=Item.Tipo.ESCRITORIO)
    services.atualizar_item(item, nome_item="Caneta Azul")
    item.refresh_from_db()
    assert item.nome_item == "Caneta Azul"
    assert item.quantidade_atual == 10


@pytest.mark.django_db
def test_ajustar_estoque():
    item = services.criar_item(codigo_item="C1", nome_item="Caneta", quantidade_atual=10, tipo=Item.Tipo.ESCRITORIO)
    services.ajustar_estoque(item, 25)
    item.refresh_from_db()
    assert item.quantidade_atual == 25


@pytest.mark.django_db
def test_ajustar_estoque_negativo_falha():
    item = services.criar_item(codigo_item="C1", nome_item="Caneta", quantidade_atual=10, tipo=Item.Tipo.ESCRITORIO)
    with pytest.raises(DomainError):
        services.ajustar_estoque(item, -1)


@pytest.mark.django_db
def test_remover_item_com_historico_bloqueado():
    from apps.colaboradores import services as colab_services
    from apps.movimentacoes import services as mov_services

    item = services.criar_item(codigo_item="C2", nome_item="Grampeador", quantidade_atual=5, tipo=Item.Tipo.ESCRITORIO)
    colaborador = colab_services.criar_colaborador(nome="Fulano")
    mov_services.registrar_saida(item_id=item.id, colaborador_id=colaborador.id, quantidade=1, usuario=None)

    with pytest.raises(DomainError):
        services.remover_item(item)


@pytest.mark.django_db
def test_importar_itens_csv_sucesso_e_falhas():
    conteudo = (
        "codigo_item;nome_item;quantidade_atual;tipo\n"
        "I1;Caneta;10;Escritório\n"
        "I2;Item Ruim;-5;Escritório\n"
        "I1;Duplicado;3;Escritório\n"
    )
    arquivo = io.BytesIO(conteudo.encode("utf-8"))

    class Upload:
        file = arquivo

    resultado = services.importar_itens_csv(Upload())
    assert resultado.sucessos == 1
    assert len(resultado.falhas) == 2
