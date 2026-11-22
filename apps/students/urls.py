from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, ClearanceRequirementViewSet

router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'clearance', ClearanceRequirementViewSet)

urlpatterns = router.urls
