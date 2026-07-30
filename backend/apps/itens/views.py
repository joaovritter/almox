from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsAdminRole

from . import services
from .models import Item
from .serializers import AjustarEstoqueSerializer, ImportCsvSerializer, ItemSerializer, ItemUpdateSerializer


class ItemViewSet(viewsets.ModelViewSet):
    """CRUD de itens de estoque. Leitura para qualquer autenticado, escrita restrita a admins."""

    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["tipo"]
    search_fields = ["nome_item", "codigo_item"]

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return ItemUpdateSerializer
        return ItemSerializer

    def get_permissions(self):
        if self.action in (
            "create",
            "update",
            "partial_update",
            "destroy",
            "importar_csv",
            "ajustar_estoque",
        ):
            return [IsAdminRole()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.instance = services.criar_item(**serializer.validated_data)

    def perform_update(self, serializer):
        serializer.instance = services.atualizar_item(serializer.instance, **serializer.validated_data)

    def perform_destroy(self, instance):
        services.remover_item(instance)

    @action(detail=False, methods=["post"], url_path="importar-csv")
    def importar_csv(self, request):
        serializer = ImportCsvSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resultado = services.importar_itens_csv(serializer.validated_data["arquivo"])
        return Response(
            {"sucessos": resultado.sucessos, "falhas": resultado.falhas},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="ajustar-estoque")
    def ajustar_estoque(self, request, pk=None):
        item = self.get_object()
        serializer = AjustarEstoqueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = services.ajustar_estoque(item, serializer.validated_data["quantidade_atual"])
        return Response(ItemSerializer(item).data)
