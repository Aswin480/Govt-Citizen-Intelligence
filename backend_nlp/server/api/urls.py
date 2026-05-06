from django.urls import path
from . import views

urlpatterns = [
    path("core-values/", views.core_values, name="core-values"),
    path("batches/", views.batches, name="batches"),
    path("mps/", views.list_mps, name="mps"),
    path("mps/<str:mp_name>/scores/", views.mp_scores, name="mp-scores"),
    path("mps/<str:mp_name>/evidence/", views.mp_evidence, name="mp-evidence"),
    path(
        "mps/<str:mp_name>/core/<str:core_value>/",
        views.mp_core_summary,
        name="mp-core-summary",
    ),    path("mps/<str:mp_name>/speeches/", views.mp_speeches, name="mp-speeches"),    path("ingest/status/", views.ingest_status, name="ingest-status"),
]
