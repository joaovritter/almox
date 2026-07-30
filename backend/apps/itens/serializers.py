from rest_framework import serializers

from .models import Item


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ["id", "codigo_item", "nome_item", "quantidade_atual", "tipo", "requer_aprovacao"]


class ItemUpdateSerializer(serializers.ModelSerializer):
    """Usado em update/partial_update: não permite alterar quantidade_atual diretamente."""

    class Meta:
        model = Item
        fields = ["id", "codigo_item", "nome_item", "tipo", "requer_aprovacao"]


class AjustarEstoqueSerializer(serializers.Serializer):
    quantidade_atual = serializers.IntegerField(min_value=0)


class ImportCsvSerializer(serializers.Serializer):
    arquivo = serializers.FileField()
