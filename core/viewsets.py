"""
ViewSets untuk DRF Router.
Semua CRUD endpoint model dihandle di sini menggunakan ModelViewSet.
Endpoint khusus (auth, ML, submissions) tetap di views.py.
"""
import os
import json
import random
import traceback

from django.utils import timezone
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import SessionAuthentication

from .models import (
    User, DataEntry, Analysis, AIModel, Visualization,
    TrainingSession, Workflow, Collaboration, Insight,
    Dataset, APIKey, IntelligenceSubmission
)
from .serializers import (
    UserSerializer, DataEntrySerializer, AnalysisSerializer,
    AIModelSerializer, VisualizationSerializer, TrainingSessionSerializer,
    WorkflowSerializer, CollaborationSerializer, InsightSerializer,
    DatasetSerializer, APIKeySerializer, IntelligenceSubmissionSerializer
)


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """Izinkan request tanpa CSRF token (agar Flutter/Postman bisa akses)."""
    def enforce_csrf(self, request):
        return  # Skip CSRF check


class BaseUserViewSet(viewsets.ModelViewSet):
    """Base ViewSet: filter data hanya milik user yg login."""
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ─────────────────────────────────────────────────────────────
# DATA COLLECTION
# ─────────────────────────────────────────────────────────────
class DataEntryViewSet(BaseUserViewSet):
    """
    ViewSet DataEntry (Data Collection).

    GET    /api/v2/data-collection/          → list semua
    POST   /api/v2/data-collection/          → buat baru
    GET    /api/v2/data-collection/{id}/     → detail
    PUT    /api/v2/data-collection/{id}/     → update penuh
    PATCH  /api/v2/data-collection/{id}/     → update sebagian
    DELETE /api/v2/data-collection/{id}/     → hapus
    """
    queryset = DataEntry.objects.all().order_by('-created_at')
    serializer_class = DataEntrySerializer


# ─────────────────────────────────────────────────────────────
# ANALYSIS
# ─────────────────────────────────────────────────────────────
class AnalysisViewSet(BaseUserViewSet):
    """
    ViewSet Analysis.

    GET    /api/v2/analysis/          → list
    POST   /api/v2/analysis/          → buat (otomatis generate mock result)
    GET    /api/v2/analysis/{id}/     → detail
    PUT    /api/v2/analysis/{id}/     → update
    DELETE /api/v2/analysis/{id}/     → hapus
    """
    queryset = Analysis.objects.all().order_by('-created_at')
    serializer_class = AnalysisSerializer

    def perform_create(self, serializer):
        mock_result = {
            'summary': f'Analisis telah diproses',
            'metrics': {
                'accuracy': f"{(random.random() * 30 + 70):.1f}",
                'precision': f"{(random.random() * 30 + 70):.1f}",
                'recall': f"{(random.random() * 30 + 70):.1f}",
            },
            'findings': [
                'Pola data terdeteksi',
                'Korelasi positif ditemukan',
                'Anomali minor teridentifikasi',
            ]
        }
        serializer.save(user=self.request.user, result=mock_result, status='completed')


# ─────────────────────────────────────────────────────────────
# AI MODELS
# ─────────────────────────────────────────────────────────────
class AIModelViewSet(BaseUserViewSet):
    """
    ViewSet AIModel.

    GET    /api/v2/models/          → list
    POST   /api/v2/models/          → buat
    GET    /api/v2/models/{id}/     → detail
    PUT    /api/v2/models/{id}/     → update
    DELETE /api/v2/models/{id}/     → hapus
    """
    queryset = AIModel.objects.all().order_by('-created_at')
    serializer_class = AIModelSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, status='draft')


# ─────────────────────────────────────────────────────────────
# VISUALIZATION
# ─────────────────────────────────────────────────────────────
class VisualizationViewSet(BaseUserViewSet):
    """
    ViewSet Visualization.

    GET    /api/v2/visualization/          → list
    POST   /api/v2/visualization/          → buat
    GET    /api/v2/visualization/{id}/     → detail
    PUT    /api/v2/visualization/{id}/     → update
    DELETE /api/v2/visualization/{id}/     → hapus
    """
    queryset = Visualization.objects.all().order_by('-created_at')
    serializer_class = VisualizationSerializer


# ─────────────────────────────────────────────────────────────
# TRAINING SESSION
# ─────────────────────────────────────────────────────────────
class TrainingSessionViewSet(BaseUserViewSet):
    """
    ViewSet TrainingSession.

    GET    /api/v2/training/          → list
    POST   /api/v2/training/          → buat sesi baru
    GET    /api/v2/training/{id}/     → detail
    PUT    /api/v2/training/{id}/     → update (progress, status)
    DELETE /api/v2/training/{id}/     → hapus

    Extra action:
    POST   /api/v2/training/{id}/complete/ → tandai selesai
    """
    queryset = TrainingSession.objects.all().order_by('-created_at')
    serializer_class = TrainingSessionSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, status='queued', progress=0)

    def perform_update(self, serializer):
        instance = serializer.save()
        # Auto set completed_at jika status = completed
        if instance.status == 'completed' and not instance.completed_at:
            instance.completed_at = timezone.now()
            instance.save(update_fields=['completed_at'])

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """POST /api/v2/training/{id}/complete/ → tandai sesi selesai"""
        session = self.get_object()
        session.status = 'completed'
        session.progress = 100.0
        session.completed_at = timezone.now()
        session.save()
        return Response({'message': 'Sesi pelatihan ditandai selesai.'})


# ─────────────────────────────────────────────────────────────
# AUTOMATION (Workflow)
# ─────────────────────────────────────────────────────────────
class WorkflowViewSet(BaseUserViewSet):
    """
    ViewSet Workflow (Automation).

    GET    /api/v2/automation/          → list
    POST   /api/v2/automation/          → buat
    GET    /api/v2/automation/{id}/     → detail
    PUT    /api/v2/automation/{id}/     → update
    DELETE /api/v2/automation/{id}/     → hapus

    Extra action:
    POST   /api/v2/automation/{id}/toggle/ → aktif/nonaktif workflow
    """
    queryset = Workflow.objects.all().order_by('-created_at')
    serializer_class = WorkflowSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, status='inactive')

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """POST /api/v2/automation/{id}/toggle/ → toggle status aktif"""
        workflow = self.get_object()
        workflow.status = 'active' if workflow.status == 'inactive' else 'inactive'
        workflow.save()
        serializer = self.get_serializer(workflow)
        return Response(serializer.data)


# ─────────────────────────────────────────────────────────────
# COLLABORATION
# ─────────────────────────────────────────────────────────────
class CollaborationViewSet(BaseUserViewSet):
    """
    ViewSet Collaboration.

    GET    /api/v2/collaboration/          → list
    POST   /api/v2/collaboration/          → buat
    GET    /api/v2/collaboration/{id}/     → detail
    PUT    /api/v2/collaboration/{id}/     → update
    DELETE /api/v2/collaboration/{id}/     → hapus
    """
    queryset = Collaboration.objects.all().order_by('-created_at')
    serializer_class = CollaborationSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, status='active')


# ─────────────────────────────────────────────────────────────
# INSIGHTS
# ─────────────────────────────────────────────────────────────
class InsightViewSet(BaseUserViewSet):
    """
    ViewSet Insight.

    GET    /api/v2/insights/          → list
    POST   /api/v2/insights/          → buat
    GET    /api/v2/insights/{id}/     → detail
    PUT    /api/v2/insights/{id}/     → update
    DELETE /api/v2/insights/{id}/     → hapus
    """
    queryset = Insight.objects.all().order_by('-created_at')
    serializer_class = InsightSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, status='new')


# ─────────────────────────────────────────────────────────────
# DATASET
# ─────────────────────────────────────────────────────────────
class DatasetViewSet(BaseUserViewSet):
    """
    ViewSet Dataset.

    GET    /api/v2/datasets/          → list
    POST   /api/v2/datasets/          → upload dataset (multipart/form-data)
    GET    /api/v2/datasets/{id}/     → detail
    PUT    /api/v2/datasets/{id}/     → update
    DELETE /api/v2/datasets/{id}/     → hapus (termasuk hapus file)
    """
    queryset = Dataset.objects.all().order_by('-created_at')
    serializer_class = DatasetSerializer

    def perform_destroy(self, instance):
        # Hapus file fisik jika ada
        if instance.file_upload:
            file_path = instance.file_upload.path
            if os.path.isfile(file_path):
                os.remove(file_path)
        instance.delete()


# ─────────────────────────────────────────────────────────────
# API KEY (hanya admin / superuser)
# ─────────────────────────────────────────────────────────────
class APIKeyViewSet(viewsets.ModelViewSet):
    """
    ViewSet APIKey — hanya bisa diakses superuser.

    GET    /api/v2/api-keys/          → list semua key
    POST   /api/v2/api-keys/          → buat key baru (auto-generate)
    GET    /api/v2/api-keys/{id}/     → detail
    PATCH  /api/v2/api-keys/{id}/     → update (misal nonaktifkan)
    DELETE /api/v2/api-keys/{id}/     → hapus

    Extra action:
    POST   /api/v2/api-keys/generate/ → generate key baru dengan nama
    """
    queryset = APIKey.objects.all().order_by('-created_at')
    serializer_class = APIKeySerializer
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return APIKey.objects.all().order_by('-created_at')
        return APIKey.objects.none()

    def perform_create(self, serializer):
        serializer.save(key=APIKey.generate_key())

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        POST /api/v2/api-keys/generate/
        Body: { "name": "Tim A", "email": "tim@example.com" }
        → Generate API key baru
        """
        if not request.user.is_superuser:
            return Response(
                {'error': 'Hanya superuser yang bisa generate API key.'},
                status=status.HTTP_403_FORBIDDEN
            )
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        if not name:
            return Response(
                {'error': 'Nama wajib diisi.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        api_key = APIKey.objects.create(
            key=APIKey.generate_key(),
            name=name,
            email=email or None,
            is_active=True,
        )
        return Response({
            'message': 'API key berhasil dibuat.',
            'api_key': {
                'id': api_key.id,
                'name': api_key.name,
                'email': api_key.email,
                'key': api_key.key,   # Tampilkan SEKALI saja saat dibuat
                'is_active': api_key.is_active,
                'created_at': api_key.created_at.isoformat(),
            }
        }, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────
# INTELLIGENCE SUBMISSION (baca/kelola oleh tim internal)
# ─────────────────────────────────────────────────────────────
class IntelligenceSubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet IntelligenceSubmission — untuk tim internal memproses submission.

    GET    /api/v2/submissions/          → list semua submission
    GET    /api/v2/submissions/{id}/     → detail
    PATCH  /api/v2/submissions/{id}/     → update stage/status
    DELETE /api/v2/submissions/{id}/     → hapus

    Extra actions:
    POST   /api/v2/submissions/{id}/advance/ → naikkan stage +1
    POST   /api/v2/submissions/{id}/reject/  → tolak submission
    GET    /api/v2/submissions/stats/        → ringkasan statistik
    """
    queryset = IntelligenceSubmission.objects.all().order_by('-received_at')
    serializer_class = IntelligenceSubmissionSerializer
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = IntelligenceSubmission.objects.all().order_by('-received_at')

        # Filter opsional via query param
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(sender_name__icontains=search) |
                Q(description__icontains=search)
            )

        return qs

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance = serializer.save()
        if old_status != 'sent' and instance.status == 'sent':
            self.send_to_implementation(instance)

    def send_to_implementation(self, submission):
        import requests
        import os
        import subprocess
        import tempfile
        from django.conf import settings
        from datetime import datetime

        # Endpoint Implementation API — target Dataset model (DSO table)
        url = "http://implementation_web:8000/api-content/datasets/"

        if not submission.source_file:
            print("No source file attached to submission, cannot send to implementation.")
            return

        file_path = submission.source_file.path
        if not os.path.exists(file_path):
            print(f"File {file_path} not found.")
            return

        # === Generate PDF Report from pipeline_data ===
        pdf_path = None
        try:
            pd = submission.pipeline_data or {}
            # Helper to read stage data with fallback
            def get_stage(n):
                return pd.get(f'stage_{n}', pd.get(str(n), {}))

            stage0 = get_stage(0)
            stage1 = get_stage(1)
            stage3 = get_stage(3)
            stage5 = get_stage(5)
            stage7 = get_stage(7)

            metrics = stage7.get('metrics', {})
            accuracy = metrics.get('accuracy', stage5.get('refined_metrics', {}).get('accuracy', 0))
            precision = metrics.get('precision', 0)
            recall = metrics.get('recall', 0)
            f1 = metrics.get('f1', 0)

            track = stage0.get('track', 'tabular')
            task_type = stage0.get('task_type', 'classification')
            target_col = stage1.get('target_column', stage0.get('suggested_target', 'target'))
            selected_model = stage3.get('selected_model', 'Random Forest')
            job_id = stage7.get('job_id', 'N/A')

            # Format accuracy for display
            acc_display = f"{accuracy:.1f}" if isinstance(accuracy, (int, float)) and accuracy > 1 else f"{accuracy*100:.1f}"
            prec_display = f"{precision:.3f}" if isinstance(precision, (int, float)) else str(precision)
            rec_display = f"{recall:.3f}" if isinstance(recall, (int, float)) else str(recall)
            f1_display = f"{f1:.3f}" if isinstance(f1, (int, float)) else str(f1)

            now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>AutoML Training Report - {submission.title}</title>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f7fafc; color: #2d3748; margin: 0; padding: 40px; }}
        .container {{ max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
        .header {{ border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }}
        .header h1 {{ font-size: 28px; color: #4a5568; margin: 0; }}
        .header p {{ color: #718096; margin: 5px 0 0 0; }}
        .section-title {{ font-size: 20px; color: #2b6cb0; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase; font-weight: 600; }}
        .grid {{ display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; }}
        .card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px 20px; text-align: center; }}
        .metric {{ font-size: 32px; font-weight: bold; color: #2b6cb0; }}
        .label {{ font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 1px; }}
        .info-row {{ display: flex; justify-content: space-between; border-bottom: 1px solid #edf2f7; padding: 10px 0; }}
        .info-row:last-child {{ border: none; }}
        .info-label {{ font-weight: 600; color: #4a5568; }}
        .info-value {{ color: #2d3748; }}
        .badge {{ display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }}
        .badge-success {{ background: #c6f6d5; color: #22543d; }}
        .insight-box {{ background: #ebf8ff; border-left: 4px solid #3182ce; padding: 15px 20px; border-radius: 0 6px 6px 0; margin: 15px 0; font-size: 14px; line-height: 1.6; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
        th {{ text-align: left; background: #edf2f7; padding: 10px; font-size: 12px; text-transform: uppercase; color: #4a5568; border: 1px solid #e2e8f0; }}
        td {{ padding: 10px; border: 1px solid #e2e8f0; font-size: 13px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AutoML Training Report</h1>
            <p>Submission: {submission.title} | Sender: {submission.sender_name} | Generated: {now_str}</p>
        </div>

        <div class="grid">
            <div class="card">
                <div class="metric">{acc_display}%</div>
                <div class="label">Accuracy</div>
            </div>
            <div class="card">
                <div class="metric">{prec_display}</div>
                <div class="label">Precision</div>
            </div>
            <div class="card">
                <div class="metric">{rec_display}</div>
                <div class="label">Recall</div>
            </div>
            <div class="card">
                <div class="metric">{f1_display}</div>
                <div class="label">F1 Score</div>
            </div>
        </div>

        <div class="section-title">Pipeline Information</div>
        <div class="info-row"><span class="info-label">Job ID</span><span class="info-value">{job_id}</span></div>
        <div class="info-row"><span class="info-label">Track</span><span class="info-value">{track}</span></div>
        <div class="info-row"><span class="info-label">Task Type</span><span class="info-value">{task_type}</span></div>
        <div class="info-row"><span class="info-label">Target Column</span><span class="info-value">{target_col}</span></div>
        <div class="info-row"><span class="info-label">Selected Model</span><span class="info-value">{selected_model}</span></div>
        <div class="info-row"><span class="info-label">Data Type</span><span class="info-value">{submission.detected_data_type or 'tabular'}</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="badge badge-success">Completed</span></span></div>

        <div class="section-title">Submission Details</div>
        <table>
            <tr><th>Field</th><th>Value</th></tr>
            <tr><td>Title</td><td>{submission.title}</td></tr>
            <tr><td>Sender</td><td>{submission.sender_name} ({submission.sender_team})</td></tr>
            <tr><td>Email</td><td>{submission.sender_email or 'N/A'}</td></tr>
            <tr><td>File</td><td>{submission.file_name or os.path.basename(file_path)}</td></tr>
            <tr><td>File Size</td><td>{submission.file_size} bytes</td></tr>
            <tr><td>Received</td><td>{submission.received_at}</td></tr>
            <tr><td>Completed</td><td>{submission.completed_at or now_str}</td></tr>
        </table>

        <div class="section-title">AI Insight</div>
        <div class="insight-box">
            Model <strong>{selected_model}</strong> berhasil dilatih pada dataset dengan tipe <strong>{track}</strong>
            untuk task <strong>{task_type}</strong>. Akurasi akhir mencapai <strong>{acc_display}%</strong>
            dengan precision {prec_display}, recall {rec_display}, dan F1-score {f1_display}.
            Model ini siap untuk diintegrasikan ke sistem produksi.
        </div>
    </div>
</body>
</html>"""

            # Write HTML to temp file
            html_fd, html_path = tempfile.mkstemp(suffix='.html', prefix='report_')
            pdf_fd, pdf_path = tempfile.mkstemp(suffix='.pdf', prefix='report_')
            os.close(html_fd)
            os.close(pdf_fd)

            with open(html_path, 'w', encoding='utf-8') as hf:
                hf.write(html_content)

            # Convert HTML to PDF using wkhtmltopdf
            result = subprocess.run(
                ['wkhtmltopdf', '--quiet', '--no-stop-slow-scripts',
                 '--disable-smart-shrinking', '--page-size', 'A4',
                 '--margin-top', '10mm', '--margin-bottom', '10mm',
                 '--margin-left', '10mm', '--margin-right', '10mm',
                 html_path, pdf_path],
                capture_output=True, text=True, timeout=30
            )

            if result.returncode != 0:
                print(f"wkhtmltopdf error: {result.stderr}")
                # Fallback: send original file if PDF generation fails
                pdf_path = None

            # Clean up HTML temp file
            if os.path.exists(html_path):
                os.unlink(html_path)

        except Exception as e:
            print(f"PDF generation warning: {e}. Falling back to source file.")
            pdf_path = None

        # === Send to Implementation API ===
        try:
            # Determine which file to send
            send_path = pdf_path if pdf_path and os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0 else file_path
            send_name = f"{submission.title or 'report'}_training_report.pdf" if send_path == pdf_path else os.path.basename(file_path)
            content_type = 'application/pdf' if send_path == pdf_path else 'application/octet-stream'

            with open(send_path, 'rb') as f:
                data = {
                    'name': submission.title or submission.sender_name or 'Unknown',
                    'file_name': send_name,
                    'file_type': submission.detected_data_type or 'tabular',
                    'activity': 'in-progress',
                    'version': '1.0',
                    'description': submission.description or submission.title or '',
                    'notes': f'Training Report - Accuracy: {accuracy}, Model: {selected_model}' if pdf_path else '',
                    'quality_score': float(accuracy) if isinstance(accuracy, (int, float)) else 0.0,
                    'source_type': 'api',
                    'user_email': submission.sender_email or 'ana@gmail.com',
                }

                files = {'pdf_file': (send_name, f, content_type)}

                headers = {'Host': '72.61.215.222'}
                res = requests.post(url, data=data, files=files, headers=headers, timeout=30)
                if res.status_code >= 400:
                    print(f"Implementation API error {res.status_code}: {res.text}")
                else:
                    print(f"Successfully sent PDF report for '{submission.title}' to Implementation.")
        except Exception as e:
            print("Failed to send submission to implementation:", e)
        finally:
            # Clean up PDF temp file
            if pdf_path and os.path.exists(pdf_path):
                try:
                    os.unlink(pdf_path)
                except OSError:
                    pass

    @action(detail=True, methods=['post'])
    def run_stage(self, request, pk=None):
        """POST /api/v2/submissions/{id}/run_stage/ → Eksekusi skrip ML untuk tahap saat ini"""
        import subprocess
        import sys
        from django.conf import settings
        
        sub = self.get_object()
        stage = sub.current_stage
        
        # Helper: baca pipeline_data dengan fallback ke format kunci lama ('stage_N' vs 'N')
        def get_stage(n):
            pd = sub.pipeline_data or {}
            return pd.get(f'stage_{n}', pd.get(str(n), {}))

        # Check track and metadata
        track = get_stage(0).get('track', 'tabular')
        task_type = get_stage(0).get('task_type', 'classification')
        target_col = get_stage(1).get('target_column', '') or get_stage(0).get('suggested_target', 'target') or 'target'
        selected_model = get_stage(3).get('selected_model', 'Random Forest')

        source_file_path = sub.source_file.path

        # Helper to check file extensions
        def ext_img(path):
            return path.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.webp'))
        def ext_txt(path):
            return path.lower().endswith(('.txt', '.md', '.log'))

        # Subprocess execution wrapper
        def run_script(args):
            python_exe = sys.executable if hasattr(sys, 'executable') else 'python'
            # Look for local venv
            for venv_dir in ['venv', '.venv']:
                venv_python = os.path.join(settings.BASE_DIR, venv_dir, 'Scripts', 'python.exe')
                if os.path.exists(venv_python):
                    python_exe = venv_python
                    break
                    
            cmd = [python_exe] + args
            try:
                res = subprocess.run(cmd, capture_output=True, text=True, cwd=settings.BASE_DIR)
                if res.returncode != 0:
                    return {"success": False, "error": res.stderr or "Script returned non-zero code"}
                return json.loads(res.stdout)
            except Exception as e:
                return {"success": False, "error": str(e)}

        result = {}
        # Switch stage
        if stage == 0:
            # Stage 0: Problem Framing
            res_json = run_script(['ml_engine/problem_framing.py', source_file_path])
            if res_json.get('error'):
                return Response({'success': False, 'error': res_json['error']}, status=status.HTTP_400_BAD_REQUEST)
            
            # Detect track/task_type
            detected_type = sub.detected_data_type
            if detected_type == 'unknown' or not detected_type:
                if ext_img(source_file_path):
                    detected_type = 'image'
                elif ext_txt(source_file_path) or source_file_path.lower().endswith('.zip'):
                    # Check ZIP content heuristically (done in recommend.py, here we check name/extension)
                    detected_type = 'image' if 'image' in source_file_path.lower() else 'text'
                else:
                    detected_type = 'tabular'
            
            track_val = 'deeplearning' if detected_type in ['image', 'text'] else 'tabular'
            task_val = 'classification'
            if detected_type == 'image':
                task_val = 'image_classification'
            elif detected_type == 'text':
                task_val = 'text_classification'
            else:
                task_val = 'regression' if res_json.get('category') == 'regresi' else 'classification'

            result = {
                "track": track_val,
                "task_type": task_val,
                "suggested_target": res_json.get('suggested_target', 'target'),
                "ipo": {
                    "input": res_json.get('input'),
                    "process": res_json.get('process'),
                    "output": res_json.get('output')
                }
            }
            if not sub.pipeline_data:
                sub.pipeline_data = {}
            sub.pipeline_data['stage_0'] = result
            sub.detected_data_type = detected_type
            sub.save(update_fields=['pipeline_data', 'detected_data_type'])
            
        elif stage == 1:
            # Stage 1: Dataset Definition
            if track == 'tabular':
                res_json = run_script(['ml_engine/analyze_data.py', source_file_path, target_col])
                if res_json.get('error'):
                    return Response({'success': False, 'error': res_json['error']}, status=status.HTTP_400_BAD_REQUEST)
                result = res_json
            elif task_type == 'image_classification':
                result = {
                    "quality_score": 95.0,
                    "target_column": "directory_name",
                    "columns_info": [{"name": "image_file", "type": "image", "missing": 0}],
                    "class_distribution": {}
                }
            else:  # text_classification
                result = {
                    "quality_score": 92.0,
                    "target_column": target_col,
                    "columns_info": [{"name": "text_content", "type": "text", "missing": 0}],
                    "class_distribution": {}
                }
            sub.pipeline_data['stage_1'] = result
            sub.save(update_fields=['pipeline_data'])

        elif stage == 2:
            # Stage 2: Data Preprocessing
            res_json = run_script(['ml_engine/data_processor.py', source_file_path, target_col, str(sub.id), track, task_type])
            if not res_json.get('success'):
                return Response({'success': False, 'error': res_json.get('error', 'Gagal memproses data')}, status=status.HTTP_400_BAD_REQUEST)
            result = res_json
            sub.pipeline_data['stage_2'] = result
            sub.save(update_fields=['pipeline_data'])

        elif stage == 3:
            # Stage 3: Model Recommendation
            res_json = run_script(['ml_engine/recommend.py', source_file_path, target_col])
            if res_json.get('error'):
                return Response({'success': False, 'error': res_json['error']}, status=status.HTTP_400_BAD_REQUEST)
            result = res_json
            sub.pipeline_data['stage_3'] = result
            sub.save(update_fields=['pipeline_data'])

        elif stage == 4:
            # Stage 4: Training & Testing
            if track == 'tabular':
                res_json = run_script(['ml_engine/train_test.py', source_file_path, target_col, selected_model])
            else:
                res_json = run_script(['ml_engine/deep_trainer.py', str(sub.id), selected_model, task_type])
                
            if not res_json.get('success', True):
                return Response({'success': False, 'error': res_json.get('error', 'Gagal melatih model')}, status=status.HTTP_400_BAD_REQUEST)
            result = res_json
            sub.pipeline_data['stage_4'] = result
            sub.save(update_fields=['pipeline_data'])

        elif stage == 5:
            # Stage 5: Refining
            res_json = run_script(['ml_engine/refiner.py', str(sub.id), selected_model, track, task_type])
            if not res_json.get('success'):
                return Response({'success': False, 'error': res_json.get('error', 'Gagal menyetel model')}, status=status.HTTP_400_BAD_REQUEST)
            result = res_json
            sub.pipeline_data['stage_5'] = result
            sub.save(update_fields=['pipeline_data'])

        elif stage == 6 or stage == 7:
            # Stage 6 & 7: Laporan
            temp_json_path = os.path.join(settings.MEDIA_ROOT, 'processed_data', str(sub.id), 'pipeline_data.json')
            os.makedirs(os.path.dirname(temp_json_path), exist_ok=True)
            with open(temp_json_path, 'w', encoding='utf-8') as f:
                json.dump(sub.pipeline_data, f, ensure_ascii=False)
                
            res_json = run_script(['ml_engine/report_generator.py', temp_json_path, str(stage)])
            if not res_json.get('success'):
                return Response({'success': False, 'error': res_json.get('error', 'Gagal menghasilkan laporan')}, status=status.HTTP_400_BAD_REQUEST)
            
            result = res_json
            sub.pipeline_data[f'stage_{stage}'] = result
            sub.save(update_fields=['pipeline_data'])

        return Response({
            "success": True,
            "stage": stage,
            "result": result
        })

    @action(detail=True, methods=['post'])
    def approve_stage(self, request, pk=None):
        """POST /api/v2/submissions/{id}/approve_stage/ → Setujui tahap dan lanjut"""
        sub = self.get_object()
        stage = sub.current_stage
        
        # Save inputs if passed
        # Pastikan pipeline_data adalah dict
        if not isinstance(sub.pipeline_data, dict):
            sub.pipeline_data = {}
        
        # Helper: baca stage dengan fallback ke format kunci lama
        def get_stage_data(n):
            pd_data = sub.pipeline_data or {}
            return pd_data.get(f'stage_{n}', pd_data.get(str(n), {}))
        
        def set_stage_data(n, data):
            sub.pipeline_data[f'stage_{n}'] = data
            sub.pipeline_data[str(n)] = data  # backward compat

        # Simpan data panggung secara langsung jika dikirim dari form manual
        stage_data_input = request.data.get('stage_data')
        if stage_data_input:
            set_stage_data(stage, stage_data_input)

        # Kompatibilitas dengan input target_column dan selected_model lama
        if stage == 0:
            target_col = request.data.get('target_column') or (stage_data_input.get('suggested_target') if stage_data_input else None) or 'target'
            s0 = get_stage_data(0)
            s0['suggested_target'] = target_col
            set_stage_data(0, s0)
        elif stage == 1:
            target_col = request.data.get('target_column') or (stage_data_input.get('target_column') if stage_data_input else None) or 'target'
            s1 = get_stage_data(1)
            s1['target_column'] = target_col
            set_stage_data(1, s1)
        elif stage == 3:
            selected_model = request.data.get('selected_model') or (stage_data_input.get('selected_model') if stage_data_input else None)
            if selected_model:
                s3 = get_stage_data(3)
                s3['selected_model'] = selected_model
                set_stage_data(3, s3)
        
        if stage >= 7:
            sub.status = 'completed'
            sub.completed_at = timezone.now()
            sub.save()
            return Response({
                "success": True,
                "message": "Seluruh 8 tahap selesai! Model siap digunakan.",
                "status": sub.status,
                "current_stage": sub.current_stage
            })

        if sub.status == 'pending':
            sub.status = 'in_progress'
            sub.started_processing_at = timezone.now()
        else:
            sub.current_stage += 1
        sub.save()
        
        return Response({
            "success": True,
            "current_stage": sub.current_stage,
            "status": sub.status,
            "pipeline_data": sub.pipeline_data
        })

    @action(detail=True, methods=['post'])
    def advance(self, request, pk=None):
        """Alias untuk approve_stage (backward compatibility)"""
        return self.approve_stage(request, pk)

    @action(detail=True, methods=['post'])
    def predict(self, request, pk=None):
        """POST /api/v2/submissions/{id}/predict/ → Uji prediksi real-time dengan model terpilih"""
        import subprocess
        import sys
        from django.conf import settings
        
        sub = self.get_object()
        if sub.status != 'completed':
            return Response({'error': 'Model belum siap. Selesaikan seluruh 8 tahap terlebih dahulu.'}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES.get('file')
        input_text = request.data.get('input_text')
        
        mode = 'json'
        input_data = ""
        temp_file_path = None
        
        if uploaded_file:
            mode = 'file'
            temp_dir = os.path.join(settings.MEDIA_ROOT, 'processed_data', str(sub.id), 'temp_pred')
            os.makedirs(temp_dir, exist_ok=True)
            temp_file_path = os.path.join(temp_dir, uploaded_file.name)
            with open(temp_file_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)
            input_data = temp_file_path
        elif input_text:
            mode = 'json'
            input_data = input_text
        else:
            try:
                input_data = json.dumps(request.data)
            except:
                return Response({'error': 'Input data tidak valid.'}, status=status.HTTP_400_BAD_REQUEST)

        # Execute prediction script
        python_exe = sys.executable if hasattr(sys, 'executable') else 'python'
        for venv_dir in ['venv', '.venv']:
            venv_python = os.path.join(settings.BASE_DIR, venv_dir, 'Scripts', 'python.exe')
            if os.path.exists(venv_python):
                python_exe = venv_python
                break
                
        cmd = [python_exe, 'ml_engine/predict.py', str(sub.id), input_data, mode]
        
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, cwd=settings.BASE_DIR)
            
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
            if res.returncode != 0:
                return Response({'error': res.stderr or 'Error during prediction process'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            res_json = json.loads(res.stdout)
            if not res_json.get('success'):
                return Response({'error': res_json.get('error', 'Gagal memproses prediksi')}, status=status.HTTP_400_BAD_REQUEST)
                
            return Response(res_json)
        except Exception as e:
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """POST /api/v2/submissions/{id}/reject/ → tolak submission"""
        sub = self.get_object()
        sub.status = 'rejected'
        note = request.data.get('reason', '')
        if note:
            sub.internal_notes = (sub.internal_notes or '') + f'\n[REJECTED] {note}'
        sub.save()
        return Response({'message': 'Submission ditolak.', 'id': sub.id})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """GET /api/v2/submissions/stats/ → statistik submission"""
        total = IntelligenceSubmission.objects.count()
        return Response({
            'total': total,
            'pending': IntelligenceSubmission.objects.filter(status='pending').count(),
            'in_progress': IntelligenceSubmission.objects.filter(status='in_progress').count(),
            'completed': IntelligenceSubmission.objects.filter(status='completed').count(),
            'rejected': IntelligenceSubmission.objects.filter(status='rejected').count(),
            'sent': IntelligenceSubmission.objects.filter(status='sent').count(),
            'api_submissions': IntelligenceSubmission.objects.filter(
                api_key_used__isnull=False
            ).count(),
            'manual_submissions': IntelligenceSubmission.objects.filter(
                api_key_used__isnull=True
            ).count(),
        })
