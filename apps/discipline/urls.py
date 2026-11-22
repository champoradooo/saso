from rest_framework.routers import DefaultRouter
from .views import DisciplinaryCaseViewSet

router = DefaultRouter()
router.register(r'cases', DisciplinaryCaseViewSet)

urlpatterns = router.urls
