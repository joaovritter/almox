from rest_framework.routers import DefaultRouter

from .views import ColaboradorViewSet

router = DefaultRouter()
router.register("colaboradores", ColaboradorViewSet, basename="colaboradores")

urlpatterns = router.urls
