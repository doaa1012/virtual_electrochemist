from django.db import models
from django.utils import timezone
from django.conf import settings


# ---------------------------------------------------------
# Virtual User (session-based lightweight user)
# ---------------------------------------------------------
class VirtualUser(models.Model):
    name = models.CharField(max_length=100, blank=True, null=True)
    affiliation = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    #consent = models.BooleanField(default=False)
    session_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'VirtualUser'

    def __str__(self):
        return self.name or f"Anonymous ({self.session_id})"

class ConsentRecord(models.Model):

    virtual_user = models.ForeignKey(
        VirtualUser,
        on_delete=models.CASCADE,
        related_name="consents"
    )

    # Individual consent items
    privacy_accepted = models.BooleanField(default=False)
    participate = models.BooleanField(default=False)

    audio_consent = models.BooleanField(default=False)

    ai_processing_consent = models.BooleanField(default=False)

    publish_consent = models.BooleanField(default=False)

    author_consent = models.BooleanField(default=False)

    # GDPR tracking
    consent_version = models.CharField(
        max_length=20,
        default="v1.0"
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True
    )

    user_agent = models.TextField(
        null=True,
        blank=True
    )

    withdrawn = models.BooleanField(default=False)

    withdrawn_at = models.DateTimeField(
        null=True,
        blank=True
    )

    field_created = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ConsentRecord"

    def __str__(self):
        return f"Consent {self.id} - {self.virtual_user}"
# ---------------------------------------------------------
# Experiment Metadata
# add: created_by (Django user) + virtual_user
# ---------------------------------------------------------
class ExperimentMetadata(models.Model):

    # ---- Who uploaded ----
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="metadata_uploaded"
    )

    virtual_user = models.ForeignKey(
        VirtualUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="metadata_uploaded"
    )

    # ---- Metadata fields ----
    intended_reaction = models.CharField(max_length=255, blank=True, null=True)
    catalyst_id = models.CharField(max_length=50, blank=True, null=True)
    catalyst_composition = models.CharField(max_length=255, blank=True, null=True)

    electrode_material = models.CharField(max_length=255, blank=True, null=True)
    electrode_area = models.FloatField(blank=True, null=True)
    catalyst_loading = models.FloatField(blank=True, null=True)

    catalyst_morphology = models.CharField(max_length=255, blank=True, null=True)
    catalyst_structure = models.CharField(max_length=255, blank=True, null=True)

    electrolyte = models.CharField(max_length=255, blank=True, null=True)
    nitrogen_purging_time = models.IntegerField(blank=True, null=True)
    electrolyte_pH = models.FloatField(blank=True, null=True)

    temperature = models.FloatField(blank=True, null=True)
    reference_electrode = models.CharField(max_length=255, blank=True, null=True)

    scan_rate = models.CharField(max_length=50, blank=True, null=True)
    cycles = models.IntegerField(blank=True, null=True)

    potential_range = models.CharField(max_length=50, blank=True, null=True)
    ir_compensation = models.TextField(blank=True, null=True)
    rhe_conversion = models.TextField(blank=True, null=True)
    initial_conditioning = models.CharField(max_length=50, blank=True, null=True)

    current_density_reported = models.CharField(max_length=255, blank=True, null=True)
    forward_scan_note = models.TextField(blank=True, null=True)
    triplicate_measurements = models.CharField(max_length=255, blank=True, null=True)
    reference_electrode_testing = models.TextField(blank=True, null=True)

    article_doi = models.CharField(max_length=255, blank=True, null=True)
    article_link = models.URLField(blank=True, null=True)

    field_created = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "ExperimentMetadata"

    def __str__(self):
        return f"Metadata {self.id}"

# ---------------------------------------------------------
# 3. Experiment Folder (each metadata has a data folder)
# ---------------------------------------------------------
class ExperimentFolder(models.Model):
    metadata = models.OneToOneField(
        ExperimentMetadata,
        on_delete=models.CASCADE,
        related_name="folder"
    )

    folder_name = models.CharField(max_length=255, blank=True, null=True)
    field_created = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "ExperimentFolder"

    def __str__(self):
        return f"Folder for Metadata {self.metadata.id}"


# ---------------------------------------------------------
# 4. Files inside the folder
# ---------------------------------------------------------
class ExperimentFile(models.Model):
    folder = models.ForeignKey(
        ExperimentFolder,
        on_delete=models.CASCADE,
        related_name="files"
    )

    file = models.FileField(upload_to="experiment_data/")
    file_type = models.CharField(max_length=100, blank=True, null=True)

    field_created = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "ExperimentFile"

    def __str__(self):
        return self.file.name


# ---------------------------------------------------------
# 5. Description records (no user tracking)
# ---------------------------------------------------------
class ExperimentDescription(models.Model):
    file = models.ForeignKey(
        ExperimentFile,
        on_delete=models.CASCADE,
        related_name="descriptions",
        null=True,
        blank=True
    )

    # AUDIO ONLY
    audio = models.FileField(upload_to="experiment_audio/", blank=True, null=True)

    # keep timestamp
    field_created = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "ExperimentDescription"

    def __str__(self):
        return f"Audio description {self.id}"
