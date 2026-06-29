import os
import sys
import django

# Add project root to path
sys.path.append("/app")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from core.models import IntelligenceSubmission
from core.viewsets import IntelligenceSubmissionViewSet

def sync_all_sent():
    submissions = IntelligenceSubmission.objects.filter(status="sent")
    if not submissions.exists():
        print("Tidak ada data dengan status sent untuk dikirim.")
        return

    viewset = IntelligenceSubmissionViewSet()
    
    print(f"Menemukan {submissions.count()} data yang sudah berstatus sent. Memulai sinkronisasi...")
    
    for sub in submissions:
        print(f"Mengirim {sub.title}...")
        try:
            viewset.send_to_implementation(sub)
        except Exception as e:
            print(f"Gagal mengirim {sub.title}: {e}")

if __name__ == "__main__":
    sync_all_sent()

