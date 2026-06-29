import os
import sys
import django
sys.path.append("/app")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()
from core.models import IntelligenceSubmission
print("TOTAL SUBMISSION IN DB:", IntelligenceSubmission.objects.count())

