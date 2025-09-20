from sqlalchemy.types import UserDefinedType
import json


class Vector1536(UserDefinedType):
    cache_ok = True

    def get_col_spec(self, **kw):
        return "vector(1536)"

    def bind_processor(self, dialect):
        def process(value):
            # pgvector expects a Python list/tuple of floats
            return None if value is None else list(value)

        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            # The value from the DB is a string like "[0.1, 0.2, ...]"
            # We need to parse it into a list of floats.
            if value is None:
                return None
            return json.loads(value)

        return process
