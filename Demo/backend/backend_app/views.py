from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import VirtualUser
import uuid
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework import status
from .utils import parse_metadata_excel
from .serializers import ExperimentMetadataSerializer
import zipfile
import io
from django.forms.models import model_to_dict
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponseBadRequest
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
import subprocess, os
from django.conf import settings
from .models import ExperimentMetadata, ExperimentFolder, ExperimentFile, ExperimentDescription
from django.forms.models import model_to_dict
import json
import numpy as np
import csv
from django.conf import settings
from django.http import JsonResponse, HttpResponseBadRequest

# -----------------------------------------
# Helper: Get session_id from cookie/header
# -----------------------------------------
def get_session_id(request):
    """Return session_id from cookie, header, or GET params."""
    return (
        request.COOKIES.get("session_id")
        or request.headers.get("X-Session-Id")
        or request.GET.get("session_id")
    )


# -----------------------------------------
# 1. Start Session + Save cookie
# -----------------------------------------
@csrf_exempt
@api_view(["POST"])
def start_user_session(request):
    try:
        data = request.data
        session_id = str(uuid.uuid4())

        # Create virtual user
        user = VirtualUser.objects.create(
            name=data.get("name", ""),
            affiliation=data.get("affiliation", ""),
            email=data["email"],
            consent=data.get("consent", False),
            session_id=session_id
        )

        # Prepare response
        response = Response(
            {"message": "User created", "user_id": user.id, "session_id": session_id},
            status=status.HTTP_201_CREATED
        )

        # Store cookie
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=False,  # change to True in production
            secure=False,
            samesite="Lax",
            max_age=7 * 24 * 60 * 60,  # 7 days
        )

        return response

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# -----------------------------------------
# 2. Get VirtualUser from cookie
# -----------------------------------------
@csrf_exempt
@api_view(["GET"])
def get_virtual_user(request):
    session_id = get_session_id(request)

    if not session_id:
        return JsonResponse({"error": "No session_id provided"}, status=400)

    user = VirtualUser.objects.filter(session_id=session_id).first()

    if not user:
        return JsonResponse({"error": "User not found"}, status=404)

    return JsonResponse({
        "user_id": user.id,
        "name": user.name,
        "affiliation": user.affiliation,
        "email": user.email,
    })


# -----------------------------------------
# 3. Check if session exists & saved
# -----------------------------------------
@csrf_exempt
@api_view(["GET"])
def session_status(request):
    session_id = get_session_id(request)

    if not session_id:
        return Response({"error": "Missing session_id"}, status=400)

    user = VirtualUser.objects.filter(session_id=session_id).first()

    if not user:
        return Response({"error": "Session not found"}, status=404)

    return Response({
        "user_id": user.id,
        "email": user.email,
        "session_saved": getattr(user, "session_saved", False),
    })


# -----------------------------------------
# 4. Mark session as saved (e.g., after upload)
# -----------------------------------------
@csrf_exempt
@api_view(["POST"])
def save_session(request):
    session_id = get_session_id(request)

    if not session_id:
        return JsonResponse({"error": "No active session found."}, status=400)

    try:
        user = VirtualUser.objects.get(session_id=session_id)
    except VirtualUser.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)

    user.session_saved = True
    user.save(update_fields=["session_saved"])

    return JsonResponse({"message": "Session saved successfully!"})



@api_view(["POST"])
def extract_metadata_excel(request):
    excel_file = request.FILES.get("file")

    if not excel_file:
        return Response({"error": "No file uploaded"}, status=400)

    extracted = parse_metadata_excel(excel_file)
    return Response(extracted, status=200)

@csrf_exempt
@api_view(["POST"])
def create_metadata(request):
    data = request.data.copy()

    # -------------------------------------------------------
    # 1. Clean numeric fields (strip units safely)
    # -------------------------------------------------------

    def to_float(value):
        if value is None:
            return None
        try:
            return float(str(value).replace(",", ".").split()[0])
        except:
            return None   # silently ignore invalid values

    def to_int(value):
        try:
            return int(float(str(value).split()[0]))
        except:
            return None

    numeric_fields = {
        "electrode_area": to_float,
        "catalyst_loading": to_float,
        "nitrogen_purging_time": to_int,
        "electrolyte_pH": to_float,
        "temperature": to_float,
        "cycles": to_int,
    }

    for field, converter in numeric_fields.items():
        if field in data:
            data[field] = converter(data[field])

    # -------------------------------------------------------
    # 2. Attach VirtualUser OR real Django user
    # -------------------------------------------------------
    session_id = request.COOKIES.get("session_id")
    virtual_user = (
        VirtualUser.objects.filter(session_id=session_id).first()
        if session_id else None
    )

    django_user = request.user if request.user.is_authenticated else None

    # -------------------------------------------------------
    # 3. Whitelist only model fields (avoid unwanted keys)
    # -------------------------------------------------------
    allowed_fields = {f.name for f in ExperimentMetadata._meta.get_fields()}
    filtered_data = {k: v for k, v in data.items() if k in allowed_fields}

    # -------------------------------------------------------
    # 4. Create metadata
    # -------------------------------------------------------
    metadata = ExperimentMetadata.objects.create(
        created_by=django_user,
        virtual_user=virtual_user,
        **filtered_data
    )

    # -------------------------------------------------------
    # 5. Return success response
    # -------------------------------------------------------
    return Response({
        "status": "success",
        "id": metadata.id,
        "uploaded_by": (
            django_user.username
            if django_user
            else (virtual_user.email if virtual_user else "anonymous")
        ),
    })

@api_view(["POST"])
def upload_experiment_files(request):
    """
    Accepts:
      • One ZIP file (max 1 ZIP)
      • Multiple non-ZIP files
    ZIP → extracted into separate ExperimentFile records
    Non-ZIP → saved directly
    """
    metadata_id = request.POST.get("metadata_id")
    files = request.FILES.getlist("files")

    if not metadata_id:
        return Response({"error": "metadata_id is required"}, status=400)
    if not files:
        return Response({"error": "No files uploaded"}, status=400)

    try:
        metadata = ExperimentMetadata.objects.get(id=metadata_id)
    except ExperimentMetadata.DoesNotExist:
        return Response({"error": "Metadata object not found"}, status=404)

    folder, _ = ExperimentFolder.objects.get_or_create(
        metadata=metadata,
        defaults={"folder_name": f"experiment_{metadata_id}"}
    )

    #  1 ZIP allowed
    zip_files = [f for f in files if f.name.lower().endswith(".zip")]
    if len(zip_files) > 1:
        return Response({"error": "Only one ZIP file is allowed"}, status=400)

    saved_files = []

    for uploaded_file in files:

        # ---------------- ZIP HANDLING ----------------
        if uploaded_file.name.lower().endswith(".zip"):

            try:
                with zipfile.ZipFile(uploaded_file) as z:
                    for fname in z.namelist():
                        if fname.endswith("/"):
                            continue

                        file_data = z.read(fname)
                        ext = fname.split(".")[-1].lower()

                        ef = ExperimentFile(folder=folder, file_type=ext)
                        ef.file.save(fname, ContentFile(file_data), save=True)
                        saved_files.append(fname)

            except Exception as e:
                return Response(
                    {"error": f"ZIP extraction failed: {str(e)}"},
                    status=500
                )

            continue

        # --------------- SINGLE FILE ----------------
        ext = uploaded_file.name.split(".")[-1].lower()
        ef = ExperimentFile(folder=folder, file_type=ext)
        ef.file.save(uploaded_file.name, uploaded_file, save=True)
        saved_files.append(uploaded_file.name)

    return Response({
        "status": "success",
        "metadata_id": metadata_id,
        "folder": folder.folder_name,
        "files_saved": saved_files,
    })


def experiment_details(request, metadata_id):
    metadata = ExperimentMetadata.objects.get(id=metadata_id)
    folder = metadata.folder
    files = folder.files.all()

    return JsonResponse({
        "metadata": model_to_dict(metadata),
        "files": [
            {
                "id": f.id,
                "filename": f.file.name.split("/")[-1],
                "url": f.file.url
            }
            for f in files
        ]
    })


def experiment_list(request):
    items = ExperimentMetadata.objects.all().order_by("id")
    return JsonResponse({
        "ids": [m.id for m in items]
    })


def is_float(x):
    try:
        float(x)
        return True
    except:
        return False

def experiment_plot(request):
    file_url = request.GET.get("file_url")
    file_id = request.GET.get("file_id")

    if not file_url:
        return HttpResponseBadRequest("Missing file_url")
    if not file_id:
        return HttpResponseBadRequest("Missing file_id")

    # Normalize path
    relative_path = file_url.lstrip("/").replace("/", os.sep)
    file_path = os.path.join(settings.MEDIA_ROOT, relative_path)

    if not os.path.exists(file_path):
        return HttpResponseBadRequest(f"File not found: {file_path}")

    # ---------------------------------------------------------
    # 1) Retrieve metadata through file_id (100% reliable)
    # ---------------------------------------------------------
    try:
        file_obj = ExperimentFile.objects.get(id=file_id)
        metadata = file_obj.folder.metadata
        area = metadata.electrode_area or 1.0

        print("=== DEBUG: METADATA FOUND ===")
        print("File ID:", file_id)
        print("Metadata ID:", metadata.id)
        print("Electrode area:", metadata.electrode_area)

    except Exception as e:
        print("=== WARNING: Metadata lookup failed ===")
        print("Error:", str(e))
        area = 1.0

    # ---------------------------------------------------------
    # 2) Determine CV or LSV
    # ---------------------------------------------------------
    filename = os.path.basename(file_path).lower()
    is_lsv = "lsv" in filename
    is_cv = "cv" in filename

    try:
        # ---------------------------------------------------------
        # 3) Parse numeric rows
        # ---------------------------------------------------------
        rows = []
        with open(file_path, "r", errors="ignore") as f:
            for line in f:
                clean = line.replace(",", " ").strip()
                nums = [float(p) for p in clean.split() if is_float(p)]
                if len(nums) >= 2:
                    rows.append(nums)

        if not rows:
            return HttpResponseBadRequest("No numeric rows detected")

        data = np.array(rows)
        num_cols = data.shape[1]
        potential = data[:, 0]

        # ---------------------------------------------------------
        # 4) Handle LSV and CV processing
        # ---------------------------------------------------------
        if is_lsv:
            current_idx = 3 if num_cols > 3 else num_cols - 1
            current = data[:, current_idx]
            ylabel = "Current density j (A/cm²)"

        elif is_cv:
            current_idx = 2 if num_cols > 2 else num_cols - 1
            raw_current = data[:, current_idx]

            # Convert A → mA/cm²
            current = (raw_current / area) * 1000.0
            ylabel = "Current density j (mA/cm²)"

            print("Raw current range (A):", float(raw_current.min()), "→", float(raw_current.max()))
            print("Converted current (mA/cm²):", float(current.min()), "→", float(current.max()))

        else:
            current_idx = num_cols - 1
            current = data[:, current_idx]
            ylabel = "Current (A)"

        # ---------------------------------------------------------
        # 5) Return plot data
        # ---------------------------------------------------------
        return JsonResponse({
            "x": potential.tolist(),
            "y": current.tolist(),
            "xlabel": "Potential (V)",
            "ylabel": ylabel,
            "points": len(current),
            "filename": filename
        })

    except Exception as e:
        return HttpResponseBadRequest(f"Parse error: {str(e)}")



@csrf_exempt
def save_file_audio(request, file_id):
    if request.method != "POST":
        return HttpResponseBadRequest("POST request required")

    try:
        audio_file = request.FILES.get("audio")
        if not audio_file:
            return HttpResponseBadRequest("No audio file provided")

        from .models import ExperimentFile, ExperimentDescription

        file_obj = ExperimentFile.objects.get(id=file_id)

        desc = ExperimentDescription.objects.create(
            file=file_obj,
            audio=audio_file
        )

        return JsonResponse({
            "status": "success",
            "description_id": desc.id,
            "created": desc.field_created.isoformat(),
            "audio_url": desc.audio.url
        })

    except ExperimentFile.DoesNotExist:
        return HttpResponseBadRequest("File not found")

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
