import io

import pytest

from apps.core.exceptions import DomainError

from .. import services


@pytest.mark.django_db
def test_criar_colaborador():
    colaborador = services.criar_colaborador(nome="Maria Silva", setor="TI", matricula="123")
    assert colaborador.pk is not None
    assert colaborador.nome == "Maria Silva"


@pytest.mark.django_db
def test_atualizar_colaborador_parcial():
    colaborador = services.criar_colaborador(nome="Maria Silva")
    services.atualizar_colaborador(colaborador, setor="Financeiro")
    colaborador.refresh_from_db()
    assert colaborador.setor == "Financeiro"
    assert colaborador.nome == "Maria Silva"


@pytest.mark.django_db
def test_remover_colaborador_sem_historico():
    colaborador = services.criar_colaborador(nome="Maria Silva")
    services.remover_colaborador(colaborador)
    assert not services.Colaborador.objects.filter(pk=colaborador.pk).exists()


@pytest.mark.django_db
def test_remover_colaborador_com_historico_bloqueado():
    from apps.itens import services as item_services
    from apps.movimentacoes import services as mov_services
    from apps.itens.models import Item

    colaborador = services.criar_colaborador(nome="Maria Silva")
    item = item_services.criar_item(
        codigo_item="C1", nome_item="Caneta", quantidade_atual=10, tipo=Item.Tipo.ESCRITORIO
    )
    mov_services.registrar_saida(item_id=item.id, colaborador_id=colaborador.id, quantidade=1, usuario=None)

    with pytest.raises(DomainError):
        services.remover_colaborador(colaborador)


@pytest.mark.django_db
def test_importar_colaboradores_csv_sucesso():
    conteudo = "nome_colaborador;setor;matricula\nJoão;TI;001\nAna;RH;002\n"
    arquivo = io.BytesIO(conteudo.encode("utf-8"))
    arquivo.name = "colaboradores.csv"

    class Upload:
        file = arquivo

    resultado = services.importar_colaboradores_csv(Upload())
    assert resultado.sucessos == 2
    assert resultado.falhas == []


@pytest.mark.django_db
def test_importar_colaboradores_csv_colunas_faltando():
    conteudo = "nome;setor\nJoão;TI\n"
    arquivo = io.BytesIO(conteudo.encode("utf-8"))

    class Upload:
        file = arquivo

    with pytest.raises(DomainError):
        services.importar_colaboradores_csv(Upload())
