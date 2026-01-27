"""
URL configuration for backend_app project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from .views import *

urlpatterns = [
    path("admin/", admin.site.urls),

    # -------------------------------
    # Virtual User Session API
    # -------------------------------
    path("api/users/start/", start_user_session, name="start_user_session"),
    path("api/session/status/", session_status, name="session_status"),
    path("api/virtualuser/", get_virtual_user, name="get_virtual_user"),
    path("api/save-session/", save_session, name="save_session"),

    # -------------------------------
    # Metadata Extraction + Creation
    # -------------------------------
    path("api/metadata/extract/", extract_metadata_excel, name="extract_metadata_excel"),
    path("api/metadata/create/", create_metadata, name="create_metadata"),

    # -------------------------------
    # Experiment Files Upload
    # -------------------------------
    path("experiment/upload/", upload_experiment_files, name="upload_experiment_files"),
    path("experiment/plot/", experiment_plot),
    path("files/<int:file_id>/save-audio/", save_file_audio),



    # -------------------------------
    # Experiment Viewer Endpoints
    # -------------------------------
    # List all experiments → used for forward/backward navigation
    path("experiment/list/", experiment_list, name="experiment_list"),

    # Retrieve metadata + all files for a given experiment
    path(
        "experiment/<int:metadata_id>/details/",
        experiment_details,
        name="experiment_details"
    ),

   
]