from rest_framework.routers import DefaultRouter

from .views import ItemViewSet

router = DefaultRouter()
router.register("itens", ItemViewSet, basename="itens")

urlpatterns = router.urls
