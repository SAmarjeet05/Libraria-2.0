from sqlalchemy.types import TypeDecorator, String
import uuid

class SQLiteUUID(TypeDecorator):
    """Platform-independent UUID type.
    Uses String(36) internally, stores as string in SQLite."""

    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif isinstance(value, uuid.UUID):
            return str(value)
        else:
            return str(uuid.UUID(value))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            return uuid.UUID(value)