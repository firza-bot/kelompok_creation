import os
import sys
import django
sys.path.append("/app")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
from core.models import IntelligenceSubmission
print("ALL SUBMISSIONS:")
for s in IntelligenceSubmission.objects.all():
    print(f"ID: {s.id}, Title: {s.title}, Status: {s.status}")

