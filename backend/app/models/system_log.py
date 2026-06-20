from datetime import datetime
from sqlalchemy import Column, Integer, Text, DateTime, Boolean, Enum
import enum

from .base import Base
from ..core.custom_types import SQLiteUUID


class ActorType(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    AI = "ai"


class SystemLog(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    actor_type = Column(Enum(ActorType), nullable=False)
    actor_id = Column(SQLiteUUID, nullable=True)
    action = Column(Text)
    ai_response = Column('ai_response', Text)
    execution_result = Column('execution_result', Text, nullable=True)
    executed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    success = Column(Boolean, nullable=False, default=True)

    def to_dict(self):
        out = {
            "id": self.id,
            "actor_type": self.actor_type.value if hasattr(self.actor_type, 'value') else str(self.actor_type),
            "actor_id": str(self.actor_id) if self.actor_id else None,
            "action": self.action,
            "ai_response": self.ai_response,
            "execution_result": None,
            # Provide a parsed summary_result (if available) to make client-side rendering easier.
            # This will be an object with either { columns, rows } or { rowcount } when possible.
            "execution_summary": None,
            "executed_at": self.executed_at.isoformat() if self.executed_at else None,
            "success": bool(self.success)
        }

        # attempt to parse execution_result JSON if present
        try:
            if self.execution_result:
                import json as _json
                ret = _json.loads(self.execution_result)
                # Default: return the parsed JSON
                out["execution_result"] = ret
                # If the parsed JSON contains an 'attempts' array, try to extract a friendly summary
                # Find the last attempt that has a 'result' with rows or rowcount and expose it as execution_summary
                if isinstance(ret, dict) and 'attempts' in ret and isinstance(ret['attempts'], list):
                    attempts = ret['attempts']
                    # search from last to first for a result
                    for a in reversed(attempts):
                        if isinstance(a, dict) and 'result' in a and isinstance(a['result'], dict):
                            r = a['result']
                            # If r contains columns & rows, expose that
                            if 'columns' in r and 'rows' in r and isinstance(r['columns'], list) and isinstance(r['rows'], list):
                                out['execution_summary'] = {'columns': r['columns'], 'rows': r['rows']}
                                break
                            # If r contains rowcount (non-select), expose that
                            if 'rowcount' in r:
                                out['execution_summary'] = {'rowcount': r.get('rowcount')}
                                break
                    # if no suitable attempt found, leave execution_summary as None
        except Exception:
            out["execution_result"] = self.execution_result

        return out
