from rest_framework import serializers
from .models import (
    User, DataEntry, Analysis, AIModel, Visualization,
    TrainingSession, Workflow, Collaboration, Insight,
    Dataset, APIKey, IntelligenceSubmission
)


class UserSerializer(serializers.ModelSerializer):
    """Serializer untuk model User (tanpa password)"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'avatar_color', 'date_joined', 'is_active']
        read_only_fields = ['id', 'date_joined']


class DataEntrySerializer(serializers.ModelSerializer):
    """Serializer untuk DataEntry — dipakai juga di Flutter"""
    class Meta:
        model = DataEntry
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']


class AnalysisSerializer(serializers.ModelSerializer):
    data_title = serializers.SerializerMethodField()

    class Meta:
        model = Analysis
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'user']

    def get_data_title(self, obj):
        return obj.data_entry.title if obj.data_entry else None


class AIModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIModel
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']


class VisualizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visualization
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'user']


class TrainingSessionSerializer(serializers.ModelSerializer):
    model_name = serializers.SerializerMethodField()

    class Meta:
        model = TrainingSession
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'user']

    def get_model_name(self, obj):
        return obj.model.name if obj.model else None


class WorkflowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workflow
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'user']


class CollaborationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collaboration
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']


class InsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insight
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'user']


class DatasetSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Dataset
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']

    def get_file_url(self, obj):
        return obj.file_upload.url if obj.file_upload else None


class APIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = APIKey
        fields = ['id', 'name', 'email', 'is_active', 'created_at',
                  'last_used_at', 'usage_count']
        read_only_fields = ['id', 'created_at', 'last_used_at', 'usage_count']


class IntelligenceSubmissionSerializer(serializers.ModelSerializer):
    current_stage_label = serializers.CharField(
        source='get_current_stage_display', read_only=True
    )
    status_label = serializers.CharField(
        source='get_status_display', read_only=True
    )
    progress = serializers.IntegerField(
        source='progress_percentage', read_only=True
    )
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = IntelligenceSubmission
        fields = '__all__'
        read_only_fields = [
            'id', 'received_at', 'current_stage_label',
            'status_label', 'progress', 'file_url'
        ]

    def get_file_url(self, obj):
        return obj.source_file.url if obj.source_file else None

    def validate(self, attrs):
        instance = self.instance
        file_name = attrs.get('file_name', getattr(instance, 'file_name', '')) or ''
        
        if not file_name and instance and instance.source_file:
            import os
            file_name = os.path.basename(instance.source_file.name)
            
        detected_data_type = attrs.get('detected_data_type')
        if detected_data_type:
            fn_lower = file_name.lower()
            if detected_data_type == 'tabular':
                if fn_lower.endswith(('.json', '.txt', '.log', '.md')):
                    raise serializers.ValidationError({
                        'detected_data_type': f"File JSON/TXT ({file_name}) tidak dapat diproses sebagai Data Terstruktur (Structured)."
                    })
            elif detected_data_type == 'text':
                if fn_lower.endswith(('.csv', '.xlsx', '.xls')):
                    raise serializers.ValidationError({
                        'detected_data_type': f"File CSV/Excel ({file_name}) tidak dapat diproses sebagai Data Tak Terstruktur (Unstructured)."
                    })
        return attrs