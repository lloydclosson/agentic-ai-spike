from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    openai_api_key: SecretStr | None = None
    anthropic_api_key: SecretStr | None = None
    default_model: str = "openai:gpt-4o"

    app_name: str = "AI Service"
    debug: bool = False


settings = Settings()
