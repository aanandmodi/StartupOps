import os
from app.config import get_settings

settings = get_settings()

print(f"Product Agent Model: {settings.product_agent_model}")
print(f"Tech Agent Model: {settings.tech_agent_model}")
print(f"Marketing Agent Model: {settings.marketing_agent_model}")
print(f"Finance Agent Model: {settings.finance_agent_model}")
print(f"Advisor Agent Model: {settings.advisor_agent_model}")

expected = "openai/gpt-oss-120b"
assert settings.product_agent_model == expected
assert settings.tech_agent_model == expected
print("\nSUCCESS: All models set correctly to", expected)
