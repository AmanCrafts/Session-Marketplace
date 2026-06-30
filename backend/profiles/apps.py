from django.apps import AppConfig


class ProfilesConfig(AppConfig):
    name = "profiles"
    verbose_name = "Profiles"

    def ready(self) -> None:
        # Import the signal handlers so they get registered.
        from profiles import signals  # noqa: F401