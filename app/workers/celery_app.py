from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "mlm_workers",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_reject_on_worker_lost=True,
    beat_schedule={
        "propagate-pv-events": {
            "task": "app.workers.tasks.propagate_pv_events",
            "schedule": 10.0,  # every 10 seconds
        },
        "calculate-binary-bonuses": {
            "task": "app.workers.tasks.calculate_binary_bonuses",
            "schedule": 86400.0,  # once a day (adjust as needed)
        },
    },
)
