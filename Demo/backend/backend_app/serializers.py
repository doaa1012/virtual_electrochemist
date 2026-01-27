from rest_framework import serializers
from .models import VirtualUser, ExperimentMetadata


class VirtualUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = VirtualUser
        fields = "__all__"


class ExperimentMetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperimentMetadata
        fields = "__all__"
