import os
from celery import Celery

#tell celery which django settings to use
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

#creating a celery app
app = Celery("config")

#instead of configuring celery separately, read celery settings from django's settings.py
app.config_from_object("django.conf:settings", namespace="CELERY")

#auto-discover tasks.py in every installed app
#this finds reviews/tasks.py, recommendations/tasks.py
app.autodiscover_tasks() 