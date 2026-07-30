from rest_framework import serializers

from apps.colaboradores.models import Colaborador
from apps.itens.models import Item

from .models import Movimentacao


class MovimentacaoSerializer(serializers.ModelSerializer):
    item_nome = serializers.CharField(source="item.nome_item", read_only=True)
    item_codigo = serializers.CharField(source="item.codigo_item", read_only=True)
    colaborador_nome = serializers.CharField(source="colaborador.nome", read_only=True)

    class Meta:
        model = Movimentacao
        fields = [
            "id",
            "item",
            "item_nome",
            "item_codigo",
            "colaborador",
            "colaborador_nome",
            "quantidade",
            "tipo_movimento",
            "status_ti",
            "data_hora",
        ]
        read_only_fields = fields


class RegistrarMovimentacaoSerializer(serializers.Serializer):
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all())
    colaborador = serializers.PrimaryKeyRelatedField(queryset=Colaborador.objects.all())
    quantidade = serializers.IntegerField(min_value=1)


class SaidaAtivaSerializer(serializers.Serializer):
    item_id = serializers.IntegerField()
    item_nome = serializers.CharField()
    saldo = serializers.IntegerField()
    ultima_movimentacao = serializers.DateTimeField()
