from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.exceptions import DomainError
from apps.core.permissions import IsAdminRole

from . import services
from .models import Movimentacao
from .serializers import MovimentacaoSerializer, RegistrarMovimentacaoSerializer, SaidaAtivaSerializer


class MovimentacaoViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Movimentações são sempre criadas/alteradas via ações explícitas (nunca
    por create/update genéricos), para que toda regra de negócio passe pelo
    service layer em vez de permitir ao cliente setar status_ti livremente.
    """

    queryset = Movimentacao.objects.select_related("item", "colaborador").all()
    serializer_class = MovimentacaoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["tipo_movimento", "status_ti", "colaborador", "item"]

    def get_permissions(self):
        if self.action in ("retirada", "emprestimo", "devolucao", "aprovar", "rejeitar"):
            return [IsAdminRole()]
        return super().get_permissions()

    def _registrar(self, request, service_fn):
        serializer = RegistrarMovimentacaoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        movimentacao = service_fn(
            item_id=serializer.validated_data["item"].id,
            colaborador_id=serializer.validated_data["colaborador"].id,
            quantidade=serializer.validated_data["quantidade"],
            usuario=request.user,
        )
        return Response(MovimentacaoSerializer(movimentacao).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def retirada(self, request):
        """Registra uma Saída. Se o item requer aprovação, fica Pendente."""
        return self._registrar(request, services.registrar_saida)

    @action(detail=False, methods=["post"])
    def emprestimo(self, request):
        """Registra um Empréstimo. Se o item requer aprovação, fica Pendente."""
        return self._registrar(request, services.registrar_emprestimo)

    @action(detail=False, methods=["post"])
    def devolucao(self, request):
        """Registra a devolução de um item emprestado, somando de volta ao estoque."""
        return self._registrar(request, services.registrar_devolucao)

    @action(detail=False, methods=["get"])
    def pendentes(self, request):
        queryset = self.get_queryset().filter(status_ti=Movimentacao.Status.PENDENTE)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def aprovar(self, request, pk=None):
        movimentacao = services.aprovar_movimentacao(pk)
        return Response(MovimentacaoSerializer(movimentacao).data)

    @action(detail=True, methods=["post"])
    def rejeitar(self, request, pk=None):
        movimentacao = services.rejeitar_movimentacao(pk)
        return Response(MovimentacaoSerializer(movimentacao).data)

    @action(detail=False, methods=["get"], url_path="saidas-ativas")
    def saidas_ativas(self, request):
        colaborador_id_raw = request.query_params.get("colaborador_id")
        if not colaborador_id_raw:
            raise DomainError("Informe o parâmetro colaborador_id.")
        try:
            colaborador_id = int(colaborador_id_raw)
        except ValueError as exc:
            raise DomainError("colaborador_id inválido.") from exc

        resultado = services.listar_saidas_ativas_por_colaborador(colaborador_id)
        serializer = SaidaAtivaSerializer(resultado, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def historico(self, request):
        """Histórico completo, filtrável por tipo_movimento/status_ti (mesmos
        filtros de ``buscar_dados_historico`` do charl)."""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page if page is not None else queryset, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)
