from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import VirtualUser, generate_key
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
from .models import (
    ExperimentMetadata,
    ExperimentFile,
    ExperimentDescription,
    ConsentRecord,
    VirtualUser,
)
from .whisper_service import transcribe
from django.forms.models import model_to_dict
import json
import numpy as np
import csv
from django.conf import settings
from django.http import JsonResponse, HttpResponseBadRequest
import secrets
import logging
logger = logging.getLogger(__name__)

def generate_pid():
    return f"VE-{secrets.token_hex(4).upper()}"


def generate_key():
    return secrets.token_urlsafe(32)
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
# 1. Update Session + Save cookie
# -----------------------------------------

@csrf_exempt
@api_view(["POST"])
def update_virtual_user(request):
    try:

        # --------------------------------------------
        # Get session from cookie
        # --------------------------------------------
        session_id = request.COOKIES.get("session_id")

        if not session_id:
            return Response(
                {"error": "No active session found"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------------------
        # Find user
        # --------------------------------------------
        user = VirtualUser.objects.filter(
            cookie_session=session_id
        ).first()

        if not user:
            return Response(
                {"error": "Virtual user not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # --------------------------------------------
        # Update fields
        # --------------------------------------------
        data = request.data
        user.author_consent=data.get(
                "author",
                False)

        if user.author_consent:
            user.name=data.get("name")
            user.affiliation=data.get("affiliation")
            user.email=data.get("email")
        else:
            user.name=None
            user.affiliation=None
            user.email=None

        user.save()

        return Response({
            "status": "success",
            "user_id": user.id
        })

    except Exception as e:

        import traceback
        traceback.print_exc()

        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# -----------------------------------------
# 2. Get VirtualUser from cookie
# -----------------------------------------
@csrf_exempt
@api_view(["GET"])
def get_virtual_user(request):

    session_id = get_session_id(request)

    if not session_id:
        return JsonResponse({
            "user_id": None,
            "participant_id": None,
            "recovery_key": None,
            "author_consent": False,
            "name": None,
            "affiliation": None,
            "email": None,
        }, status=200)


    user = VirtualUser.objects.filter(
        cookie_session=session_id
    ).first()


    if not user:
        return JsonResponse({
            "user_id": None,
            "participant_id": None,
            "recovery_key": None,
            "author_consent": False,
            "name": None,
            "affiliation": None,
            "email": None,
        }, status=200)

    return JsonResponse({


        "user_id":user.id,

        "participant_id":
            user.participant_id,

        "recovery_key":
            user.recovery_key,

        "author_consent":
            user.author_consent,

        "name":
            user.name,

        "affiliation":
            user.affiliation,

        "email":
            user.email


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

    user = VirtualUser.objects.filter(
            cookie_session=session_id,
            is_deleted=False
        ).first()

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
        user = VirtualUser.objects.get(cookie_session=session_id)
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
    # 1. Clean numeric fields
    # -------------------------------------------------------
    def to_float(value):
        if value is None:
            return None
        try:
            return float(str(value).replace(",", ".").split()[0])
        except:
            return None

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
    # 2. Identify uploader
    # -------------------------------------------------------
    virtual_user = None

    participant_id = data.get("participant_id")
    recovery_key = data.get("recovery_key")

    # ----------------------------------------
    # A. Restore using participant credentials
    # ----------------------------------------
    if participant_id and recovery_key:

        virtual_user = VirtualUser.objects.filter(

            participant_id=participant_id,
            recovery_key=recovery_key,
            is_deleted=False

        ).first()

    # ----------------------------------------
    # B. Existing browser session
    # ----------------------------------------
    if not virtual_user:

        session_id = request.COOKIES.get("session_id")

        if session_id:

            virtual_user = VirtualUser.objects.filter(

                cookie_session=session_id,
                is_deleted=False

            ).first()

    # ----------------------------------------
    # C. Create completely new visitor
    # ----------------------------------------
    if not virtual_user:

        session_id = request.COOKIES.get("session_id")

        virtual_user = VirtualUser.objects.create(

            cookie_session=session_id

        )

    # -------------------------------------------------------
    # 3. Determine created_by
    # -------------------------------------------------------
    created_by = None

    if virtual_user:

        created_by = virtual_user.participant_id

    elif request.user.is_authenticated:

        created_by = request.user.get_username()

    else:

        created_by = "anonymous"

    # -------------------------------------------------------
    # 4. Keep only ExperimentMetadata fields
    # -------------------------------------------------------
    allowed_fields = {

        f.name

        for f in ExperimentMetadata._meta.get_fields()

        if hasattr(f, "attname")

    }

    filtered_data = {

        key: value

        for key, value in data.items()

        if key in allowed_fields

    }

    # participant_id and recovery_key are NOT model fields
    filtered_data.pop("participant_id", None)
    filtered_data.pop("recovery_key", None)

    # -------------------------------------------------------
    # 5. Create metadata
    # -------------------------------------------------------
    metadata = ExperimentMetadata.objects.create(

        created_by=created_by,

        virtual_user=virtual_user,

        **filtered_data

    )

    # -------------------------------------------------------
    # 6. Return response
    # -------------------------------------------------------
    return Response({

        "status": "success",

        "id": metadata.id,

        "participant_id": (
            virtual_user.participant_id
            if virtual_user
            else None
        ),

        "uploaded_by": created_by

    })
@api_view(["POST"])
def upload_experiment_files(request):

    metadata_id = request.POST.get("metadata_id")
    uploaded_file = request.FILES.get("files")

    if not metadata_id:
        return Response(
            {"error": "metadata_id is required"},
            status=400
        )

    if not uploaded_file:
        return Response(
            {"error": "No file uploaded"},
            status=400
        )

    try:
        metadata = ExperimentMetadata.objects.get(id=metadata_id)

    except ExperimentMetadata.DoesNotExist:

        return Response(
            {"error": "Metadata object not found"},
            status=404
        )

    # Replace old file if one already exists
    ExperimentFile.objects.filter(metadata=metadata).delete()

    experiment_file = ExperimentFile.objects.create(
        metadata=metadata,
        file=uploaded_file,
        file_type=uploaded_file.name.split(".")[-1].lower()
    )

    return Response({

        "status": "success",

        "metadata_id": metadata.id,

        "file_id": experiment_file.id,

        "filename": experiment_file.file.name.split("/")[-1],

        "file_url": experiment_file.file.url

    })
    
from django.forms.models import model_to_dict

def experiment_list(request):

    experiments = []

    metadata_list = (
        ExperimentMetadata.objects
        .select_related("virtual_user")
        .prefetch_related(
            "file__descriptions__virtual_user"
        )
        .order_by("id")
    )

    for metadata in metadata_list:

        try:
            experiment_file = metadata.file
        except ExperimentFile.DoesNotExist:
            experiment_file = None

        experiments.append({

            "metadata": model_to_dict(metadata),

            "file": None if experiment_file is None else {

                "id": experiment_file.id,
                "filename": experiment_file.file.name.split("/")[-1],
                "url": experiment_file.file.url,
                "file_type": experiment_file.file_type,

            },

            "descriptions": [] if experiment_file is None else [

                {
                    "id": d.id,
                    "audio": d.audio.url if d.audio else None,
                    "transcription": d.transcription,
                    "language": d.language,
                    "created_at": d.created_at.isoformat(),
                    "virtual_user": (
                        d.virtual_user.participant_id
                        if d.virtual_user else None
                    ),
                }

                for d in experiment_file.descriptions.all()

            ]

        })

    return JsonResponse({
        "experiments": experiments
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
        metadata = file_obj.metadata
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

        file_obj = ExperimentFile.objects.get(id=file_id)
        session_id = request.COOKIES.get("session_id")
        
        virtual_user = VirtualUser.objects.filter(
            cookie_session=session_id
        ).first()
        
        desc = ExperimentDescription.objects.create(
            experiment_file=file_obj,
            virtual_user=virtual_user,
            audio=audio_file
        )
        
        # --------------------------
        # Run Whisper
        # --------------------------
        result = transcribe(desc.audio.path)
        
        desc.transcription = result["text"]
        desc.language = result["language"]
        desc.save()
        
        return JsonResponse({
            "status": "success",
            "description_id": desc.id,
            "created": desc.created_at.isoformat(),
            "audio_url": desc.audio.url,
            "transcription": desc.transcription,
            "language": desc.language,
        })
    except ExperimentFile.DoesNotExist:
        return HttpResponseBadRequest("File not found")

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@api_view(["POST"])
def save_consent(request):
    try:

        data = request.data

        required_consents = [
            data.get("privacy", False),
            data.get("participate", False),
            data.get("audio", False)
        ]

        if not all(required_consents):

            return Response(
                {
                    "error": "All required consents must be accepted."
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        ########################################################
        # Get existing session or create a new one
        ########################################################

        session_id = get_session_id(request)

        if not session_id:
            session_id = secrets.token_urlsafe(32)


        ########################################################
        # Find existing participant
        ########################################################

        virtual_user = VirtualUser.objects.filter(

            cookie_session=session_id

        ).first()


        ########################################################
        # Create participant if it does not exist
        ########################################################

        if not virtual_user:

            virtual_user = VirtualUser.objects.create(

                cookie_session=session_id,

                author_consent=data.get("author", False),

                name=data.get("name"),

                affiliation=data.get("affiliation"),

                email=data.get("email")

            )


        ########################################################
        # Store consent record
        ########################################################

        consent = ConsentRecord.objects.create(

            virtual_user=virtual_user,

            privacy_accepted=data.get("privacy", False),

            participate=data.get("participate", False),

            audio_consent=data.get("audio", False),

            consent_version="v1.0",

            ip_address=request.META.get("REMOTE_ADDR"),

            user_agent=request.META.get("HTTP_USER_AGENT")

        )


        ########################################################
        # Response
        ########################################################

        response = Response(

            {

                "status": "success",

                "virtual_user_id":
                    virtual_user.id,

                "consent_id":
                    consent.id,

                "participant_id":
                    virtual_user.participant_id,

                "recovery_key":
                    virtual_user.recovery_key

            },

            status=status.HTTP_201_CREATED

        )


        ########################################################
        # Save EXACT SAME session_id in browser cookie
        ########################################################

        response.set_cookie(

            key="session_id",

            value=session_id,

            httponly=True,

            secure=False,      # True in production

            samesite="Lax",

            max_age=7 * 24 * 60 * 60

        )


        return response


    except Exception as e:

        logger.exception(e)

        return Response(

            {

                "error":
                "An unexpected error occurred while saving your consent. Please try again."

            },

            status=status.HTTP_500_INTERNAL_SERVER_ERROR

        )
    
def experiment_details(request, metadata_id):

    try:
        metadata = ExperimentMetadata.objects.get(id=metadata_id)

    except ExperimentMetadata.DoesNotExist:

        return JsonResponse(
            {"error": "Metadata not found"},
            status=404
        )

    try:
        experiment_file = metadata.file

    except ExperimentFile.DoesNotExist:

        experiment_file = None

    return JsonResponse({

        "metadata": model_to_dict(metadata),

        "file": None if experiment_file is None else {

            "id": experiment_file.id,

            "filename": experiment_file.file.name.split("/")[-1],

            "url": experiment_file.file.url,

            "file_type": experiment_file.file_type,

        },

        "descriptions": [] if experiment_file is None else [

            {

                "id": description.id,

                "audio": (
                    description.audio.url
                    if description.audio
                    else None
                ),

                "transcription": description.transcription,

                "language": description.language,

                "virtual_user": (
                    description.virtual_user.participant_id
                    if description.virtual_user
                    else None
                ),

                "created_at": description.created_at.isoformat(),

            }

            for description in experiment_file.descriptions.all()

        ]

    })
@api_view(["POST"])
def restore_session(request):

    participant_id=request.data.get(

    "participant_id" )

    recovery_key=request.data.get(
    "recovery_key")

    user=VirtualUser.objects.filter(
    participant_id=participant_id,
    recovery_key=recovery_key,
    is_deleted=False ).first()

    if not user:
        return Response(
            {"error":"Invalid credentials"},
            status=404
        )
    
    cookie_session=secrets.token_urlsafe(32)
    user.cookie_session=cookie_session
    user.save()
    response=Response(

    {"status":"success"})

    response.set_cookie(

    "session_id",
    cookie_session,
    httponly=True,
    samesite="Lax")
    return response
