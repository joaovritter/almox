from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsAdminRole

from . import services
from .models import Colaborador
from .serializers import ColaboradorSerializer, ImportCsvSerializer


class ColaboradorViewSet(viewsets.ModelViewSet):
    """CRUD de colaboradores. Leitura para qualquer autenticado, escrita restrita a admins."""

    queryset = Colaborador.objects.all()
    serializer_class = ColaboradorSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["nome", "matricula", "setor"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy", "importar_csv"):
            return [IsAdminRole()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.instance = services.criar_colaborador(**serializer.validated_data)

    def perform_update(self, serializer):
        serializer.instance = services.atualizar_colaborador(serializer.instance, **serializer.validated_data)

    def perform_destroy(self, instance):
        services.remover_colaborador(instance)

    @action(detail=False, methods=["post"], url_path="importar-csv")
    def importar_csv(self, request):
        serializer = ImportCsvSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resultado = services.importar_colaboradores_csv(serializer.validated_data["arquivo"])
        return Response(
            {"sucessos": resultado.sucessos, "falhas": resultado.falhas},
            status=status.HTTP_201_CREATED,
        )
