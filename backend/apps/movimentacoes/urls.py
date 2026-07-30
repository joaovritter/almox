from rest_framework.routers import DefaultRouter

from .views import MovimentacaoViewSet

router = DefaultRouter()
router.register("movimentacoes", MovimentacaoViewSet, basename="movimentacoes")

urlpatterns = router.urls
