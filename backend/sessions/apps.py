from django.apps import AppConfig


class SessionsConfig(AppConfig):
    name = "sessions"
    label = "marketplace_sessions"
    verbose_name = "Sessions"

    def ready(self) -> None:
        # Import signal handlers so they get registered.
        from sessions import signals  # noqa: F401