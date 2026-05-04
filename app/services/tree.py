"""
Binary tree insertion — production-safe for 1000+ concurrent registrations.

Strategy:
    1. pg_advisory_xact_lock on a GLOBAL tree-mutation key serialises all
       insertions so two concurrent BFS searches can never race to the same
       empty slot.  Lock is held only for the BFS + one UPDATE, typically < 5 ms.
    2. The BFS itself runs as a single recursive CTE inside PostgreSQL — zero
       round-trips, works efficiently up to 100k+ nodes.
    3. An additional SELECT … FOR UPDATE on the chosen parent row acts as a
       safety net even if advisory locks are ever relaxed.
"""
from __future__ import annotations

import uuid
from collections import deque
from typing import Tuple

from sqlalchemy import text, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Wallet
from app.exceptions import TreePlacementError

# Constant advisory-lock key for tree mutations.
_TREE_LOCK: int = 0x4D4C4D54  # "MLMT"


async def place_user_in_tree(
    session: AsyncSession,
    new_user: User,
    sponsor_id: uuid.UUID,
    preferred_side: str,  # "L" or "R"
) -> None:
    """
    Place *new_user* into the binary tree under *sponsor_id*.

    Preferred side is tried first; if occupied, BFS from the sponsor's
    subtree finds the first available slot (breadth-first spillover).

    The entire operation is expected to run inside a transaction begun
    by the caller.
    """
    preferred_side = preferred_side.upper()
    if preferred_side not in ("L", "R"):
        raise TreePlacementError("Side must be 'L' or 'R'")

    # ── 1. Acquire global tree lock (released on COMMIT / ROLLBACK) ──
    await session.execute(
        text("SELECT pg_advisory_xact_lock(:key)"),
        {"key": _TREE_LOCK},
    )

    # ── 2. Find placement position via in-DB BFS CTE ────────────────
    parent_id, side = await _find_slot_cte(session, sponsor_id, preferred_side)

    # ── 3. Lock the parent row (belt-and-suspenders) ─────────────────
    result = await session.execute(
        select(User).where(User.id == parent_id).with_for_update()
    )
    parent = result.scalar_one()

    # Double-check slot is still free
    if side == "L" and parent.left_child_id is not None:
        raise TreePlacementError("Slot occupied (race condition caught)")
    if side == "R" and parent.right_child_id is not None:
        raise TreePlacementError("Slot occupied (race condition caught)")

    # ── 4. Wire the tree edges ───────────────────────────────────────
    if side == "L":
        parent.left_child_id = new_user.id
    else:
        parent.right_child_id = new_user.id

    new_user.parent_id = parent_id
    new_user.placement_side = side
    new_user.sponsor_id = sponsor_id

    session.add(parent)
    session.add(new_user)
    await session.flush()


# ─────────────────────────────────────────────────────────────
# BFS via recursive CTE (single round-trip, handles 100k+ tree)
# ─────────────────────────────────────────────────────────────

_BFS_CTE_SQL = text("""
WITH RECURSIVE bfs AS (
    -- seed: the sponsor node
    SELECT
        id,
        left_child_id,
        right_child_id,
        0 AS lvl,
        ARRAY[CASE WHEN :preferred = 'L' THEN 0 ELSE 1 END, 0] AS sort_key
    FROM users
    WHERE id = :root

    UNION ALL

    SELECT
        u.id,
        u.left_child_id,
        u.right_child_id,
        b.lvl + 1,
        b.sort_key || CASE WHEN u.id = b.left_child_id THEN 0 ELSE 1 END
    FROM bfs b
    JOIN users u
        ON u.id = b.left_child_id OR u.id = b.right_child_id
    WHERE b.left_child_id IS NOT NULL
       OR b.right_child_id IS NOT NULL
)
SELECT
    id,
    CASE
        WHEN left_child_id IS NULL THEN 'L'
        ELSE 'R'
    END AS side
FROM bfs
WHERE left_child_id IS NULL OR right_child_id IS NULL
ORDER BY lvl, sort_key
LIMIT 1;
""")


async def _find_slot_cte(
    session: AsyncSession,
    sponsor_id: uuid.UUID,
    preferred_side: str,
) -> Tuple[uuid.UUID, str]:
    """
    Run an in-database BFS to locate the first empty child slot under
    the sponsor.  Preferred side biases the search order.
    """
    # Fast path: check sponsor directly (avoids CTE for common case)
    res = await session.execute(
        select(User).where(User.id == sponsor_id).with_for_update()
    )
    sponsor = res.scalar_one_or_none()
    if sponsor is None:
        raise TreePlacementError("Sponsor not found")

    if preferred_side == "L" and sponsor.left_child_id is None:
        return sponsor.id, "L"
    if preferred_side == "R" and sponsor.right_child_id is None:
        return sponsor.id, "R"
    # non-preferred side still empty on sponsor
    if sponsor.left_child_id is None:
        return sponsor.id, "L"
    if sponsor.right_child_id is None:
        return sponsor.id, "R"

    # Full BFS from the preferred subtree
    start_id = sponsor.left_child_id if preferred_side == "L" else sponsor.right_child_id
    row = (
        await session.execute(
            _BFS_CTE_SQL,
            {"root": str(start_id), "preferred": preferred_side},
        )
    ).first()

    if row is None:
        raise TreePlacementError("No available slot in tree (tree is full?)")

    return row.id, row.side


async def get_subtree(
    session: AsyncSession,
    root_id: uuid.UUID,
    depth: int = 5,
) -> dict | None:
    """Return nested dict of the subtree for API / visualization."""
    result = await session.execute(
        select(User).where(User.id == root_id)
    )
    root = result.scalar_one_or_none()
    if root is None:
        return None
    return await _build_node(session, root, depth)


async def _build_node(session: AsyncSession, user: User, depth: int) -> dict:
    node = {
        "id": str(user.id),
        "username": user.username,
        "placement_side": user.placement_side,
        "left_child": None,
        "right_child": None,
    }
    if depth <= 0:
        return node

    for side, child_id in [("left_child", user.left_child_id), ("right_child", user.right_child_id)]:
        if child_id:
            res = await session.execute(select(User).where(User.id == child_id))
            child = res.scalar_one_or_none()
            if child:
                node[side] = await _build_node(session, child, depth - 1)
    return node
