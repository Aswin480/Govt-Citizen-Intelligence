from django.urls import include, path
from api import views as api_views

urlpatterns = [
    path("health/", api_views.health, name="health"),
    path("api/", include("api.urls")),
]
