"""
Celery tasks — all heavy financial calculations run here, not in the API process.
Uses SYNC database sessions (Celery workers are synchronous).
"""
import logging

from app.workers.celery_app import celery_app
from app.database import SyncSessionLocal

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def propagate_pv_events(self) -> dict:
    """
    Process queued PV events — walk each event's user up to root,
    crediting left_pv / right_pv on ancestors.

    Batch-optimised for 100k+ users (each event touches ≤ log₂(N) rows).
    Uses SKIP LOCKED so multiple workers can process concurrently.
    """
    from app.services.bonus import propagate_pv_events_sync

    db = SyncSessionLocal()
    try:
        count = propagate_pv_events_sync(db, batch_size=200)
        logger.info("Propagated %d PV events", count)
        return {"propagated": count}
    except Exception as exc:
        db.rollback()
        logger.exception("PV propagation failed")
        raise self.retry(exc=exc)
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def calculate_binary_bonuses(self) -> dict:
    """
    Calculate binary bonuses for all qualifying users.
    min(left_pv, right_pv) × rate → 90% main / 10% deposit.
    Carry-forward remainder on stronger side.

    Runs once per day via Celery Beat.
    Uses SKIP LOCKED for safe concurrent execution.
    """
    from app.services.bonus import calculate_binary_bonuses_sync

    db = SyncSessionLocal()
    try:
        count = calculate_binary_bonuses_sync(db, batch_size=500)
        logger.info("Calculated %d binary bonuses", count)
        return {"bonuses_calculated": count}
    except Exception as exc:
        db.rollback()
        logger.exception("Binary bonus calculation failed")
        raise self.retry(exc=exc)
    finally:
        db.close()
