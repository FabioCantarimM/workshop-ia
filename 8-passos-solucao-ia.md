# 8 Passos para Criar uma Solução Robusta e Gerenciável com IA

> **Metodologia prática para equipes que querem velocidade com qualidade usando agentes de IA no ciclo de
> desenvolvimento.**

---

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│  1. DevContainer ──▶ 2. Arquitetura ──▶ 3. TDD ──▶ 4. Develop │
│       (Segurança)      (Desenhar)        (Validar)   (IA)      │
│                                                                 │
│  5. Entender ──▶ 6. Interface ──▶ 7. Otimizar ──▶ 8. Deploy   │
│     (Impacto)      (UI/UX)         (Performance)   (Entregar)  │
└─────────────────────────────────────────────────────────────────┘
```

| Passo           | Responsável | Objetivo                     |
| --------------- | ----------- | ---------------------------- |
| 1. DevContainer | DevOps / TL | Ambiente isolado e seguro    |
| 2. Arquitetura  | Tech Lead   | Desenho da solução           |
| 3. TDD          | Tech Lead   | Especificação por testes     |
| 4. Desenvolver  | Dev + IA    | Geração de código comandada  |
| 5. Entender     | Dev         | Revisão e análise de impacto |
| 6. Interface    | Dev + IA    | Construção do frontend       |
| 7. Otimizar     | Dev + IA    | Performance e refatoração    |
| 8. Deploy       | DevOps + IA | Entrega contínua             |

---

## Passo 1 — DevContainer (Segurança)

### Por que começar pela segurança?

Agentes de IA são poderosos, mas imprevisíveis. Um comando mal interpretado pode deletar arquivos, expor credenciais ou
consumir recursos. O **DevContainer** isola o ambiente de desenvolvimento, criando uma sandbox onde a IA opera com
**permissões restritas**.

### Princípios

- **Isolamento total**: montar apenas a pasta do projeto, nunca `~/.ssh` ou diretórios sensíveis
- **Firewall de rede**: política deny-by-default, liberar apenas domínios necessários
- **Usuário não-root**: containers rodam sem privilégios elevados
- **Zero credenciais de produção** dentro do container

### Exemplo Python — `devcontainer.json`

https://github.com/anthropics/claude-code/tree/main/.devcontainer

```json
{
    "name": "ai-safe-env",
    "image": "mcr.microsoft.com/devcontainers/python:3.12",
    "features": {
        "ghcr.io/devcontainers/features/docker-in-docker:2": {
            "moby": true
        }
    },
    "containerUser": "vscode",
    "mounts": ["source=${localWorkspaceFolder},target=/workspace,type=bind"],
    "postCreateCommand": "pip install -r requirements.txt && bash .devcontainer/init-firewall.sh",
    "customizations": {
        "vscode": {
            "extensions": ["ms-python.python", "charliermarsh.ruff"]
        }
    }
}
```

```bash
# .devcontainer/init-firewall.sh — Firewall restritivo
#!/bin/bash
iptables -P OUTPUT DROP
iptables -A OUTPUT -d pypi.org -j ACCEPT
iptables -A OUTPUT -d github.com -j ACCEPT
iptables -A OUTPUT -d api.anthropic.com -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT
echo "Firewall configurado: apenas PyPI, GitHub e Anthropic liberados."
```

### Checklist de Segurança

- [ ] Container sem acesso ao Docker socket do host
- [ ] Variáveis de ambiente sensíveis fora do container
- [ ] Imagem escaneada com `trivy` ou `snyk`
- [ ] Rede restrita por firewall

---

## Passo 2 — Arquitetura (Desenhar)

### O papel do Tech Lead

Antes de qualquer linha de código, o TL define **o que** será construído. A IA é uma ferramenta de execução — sem uma
arquitetura clara, ela gera código que funciona isoladamente mas não se integra ao sistema.

### Abordagem: Spec-Driven Development (SDD)

Diferente do "vibe coding" (ir pedindo coisas até funcionar), o SDD cria um **contrato formal** entre humano e IA:

```
Especificação ──▶ Testes ──▶ Código ──▶ Revisão
     ▲                                    │
     └────────────────────────────────────┘
```

### Exemplo Python — Especificação como código

```python
# specs/payment_service.py
"""
ESPECIFICAÇÃO: Serviço de Pagamento

RESPONSABILIDADES:
- Processar pagamentos via PIX e cartão de crédito
- Validar limites diários por usuário
- Emitir eventos de domínio após confirmação

CONTRATOS:
- Input:  PaymentRequest(user_id, amount, method)
- Output: PaymentResult(transaction_id, status, timestamp)

REGRAS DE NEGÓCIO:
- Limite diário PIX: R$ 5.000,00
- Limite diário cartão: R$ 10.000,00
- Pagamentos acima do limite devem ser enfileirados para aprovação manual

DEPENDÊNCIAS:
- PaymentGateway (interface — implementações: PagSeguro, Stripe)
- UserRepository (consulta limites)
- EventBus (publica PaymentConfirmed, PaymentRejected)

RESTRIÇÕES:
- Idempotência obrigatória (mesmo request_id não processa duas vezes)
- Timeout máximo do gateway: 30 segundos
- Retry com backoff exponencial: 3 tentativas
"""

from dataclasses import dataclass
from enum import Enum
from datetime import datetime


class PaymentMethod(Enum):
    PIX = "pix"
    CREDIT_CARD = "credit_card"


class PaymentStatus(Enum):
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    PENDING_APPROVAL = "pending_approval"


@dataclass(frozen=True)
class PaymentRequest:
    user_id: str
    amount: float
    method: PaymentMethod
    request_id: str  # idempotência


@dataclass(frozen=True)
class PaymentResult:
    transaction_id: str
    status: PaymentStatus
    timestamp: datetime
```

### Decisões arquiteturais que a IA **não** deve tomar

| Decisão                            | Quem decide           |
| ---------------------------------- | --------------------- |
| Qual banco de dados usar           | Tech Lead             |
| Padrão de comunicação (sync/async) | Tech Lead             |
| Estratégia de autenticação         | Tech Lead + Segurança |
| Estrutura de módulos               | Tech Lead             |
| Lógica de negócio específica       | Product Owner + TL    |

---

## Passo 3 — TDD (Como vai funcionar)

### Por que TDD é ideal para IA?

Quando os testes existem **antes** do código, a IA não consegue "trapacear" — ela não pode escrever testes que confirmam
comportamento quebrado. Os testes se tornam a **especificação executável**.

### Fluxo Red-Green-Refactor com IA

```
 TL escreve testes ──▶ Testes FALHAM (Red)
                            │
                    IA gera código
                            │
                    Testes PASSAM (Green)
                            │
                    IA refatora (Refactor)
                            │
                    Testes continuam PASSANDO ✓
```

### Exemplo Python — Testes primeiro

```python
# tests/test_payment_service.py
import pytest
from datetime import datetime
from unittest.mock import AsyncMock
from app.payments.service import PaymentService
from app.payments.models import (
    PaymentRequest, PaymentMethod, PaymentStatus
)


@pytest.fixture
def gateway():
    return AsyncMock()


@pytest.fixture
def user_repo():
    repo = AsyncMock()
    repo.get_daily_spent.return_value = 0.0
    return repo


@pytest.fixture
def event_bus():
    return AsyncMock()


@pytest.fixture
def service(gateway, user_repo, event_bus):
    return PaymentService(gateway, user_repo, event_bus)


class TestPaymentService:
    """Escritos pelo TL — definem O QUE o sistema deve fazer."""

    @pytest.mark.asyncio
    async def test_pix_within_limit_succeeds(self, service, gateway):
        gateway.charge.return_value = "txn_123"
        request = PaymentRequest(
            user_id="user_1",
            amount=1000.00,
            method=PaymentMethod.PIX,
            request_id="req_001"
        )

        result = await service.process(request)

        assert result.status == PaymentStatus.CONFIRMED
        assert result.transaction_id == "txn_123"

    @pytest.mark.asyncio
    async def test_pix_exceeding_limit_goes_to_approval(
        self, service, user_repo
    ):
        user_repo.get_daily_spent.return_value = 4500.00
        request = PaymentRequest(
            user_id="user_1",
            amount=600.00,  # total: 5100 > limite 5000
            method=PaymentMethod.PIX,
            request_id="req_002"
        )

        result = await service.process(request)

        assert result.status == PaymentStatus.PENDING_APPROVAL

    @pytest.mark.asyncio
    async def test_idempotency_returns_same_result(self, service, gateway):
        gateway.charge.return_value = "txn_123"
        request = PaymentRequest(
            user_id="user_1",
            amount=100.00,
            method=PaymentMethod.PIX,
            request_id="req_same"
        )

        result1 = await service.process(request)
        result2 = await service.process(request)

        assert result1.transaction_id == result2.transaction_id
        assert gateway.charge.call_count == 1  # cobrou só uma vez

    @pytest.mark.asyncio
    async def test_gateway_failure_raises(self, service, gateway):
        gateway.charge.side_effect = TimeoutError("Gateway timeout")
        request = PaymentRequest(
            user_id="user_1",
            amount=100.00,
            method=PaymentMethod.PIX,
            request_id="req_003"
        )

        with pytest.raises(TimeoutError):
            await service.process(request)

    @pytest.mark.asyncio
    async def test_confirmed_payment_emits_event(
        self, service, gateway, event_bus
    ):
        gateway.charge.return_value = "txn_456"
        request = PaymentRequest(
            user_id="user_1",
            amount=50.00,
            method=PaymentMethod.CREDIT_CARD,
            request_id="req_004"
        )

        await service.process(request)

        event_bus.publish.assert_called_once()
        event = event_bus.publish.call_args[0][0]
        assert event.name == "PaymentConfirmed"
```

### O que os testes garantem

| Teste                                       | Regra de negócio validada               |
| ------------------------------------------- | --------------------------------------- |
| `test_pix_within_limit_succeeds`            | Pagamento dentro do limite é confirmado |
| `test_pix_exceeding_limit_goes_to_approval` | Limite diário é respeitado              |
| `test_idempotency_returns_same_result`      | Idempotência funciona                   |
| `test_gateway_failure_raises`               | Falhas do gateway são propagadas        |
| `test_confirmed_payment_emits_event`        | Eventos de domínio são emitidos         |

---

## Passo 4 — Desenvolver (Comandar IA)

### Da especificação ao código

Com testes escritos e falhando (Red), o desenvolvedor **comanda a IA** para gerar a implementação. O segredo está na
qualidade do prompt.

### Framework CRISP para prompts

| Letra | Significado    | Exemplo                                                   |
| ----- | -------------- | --------------------------------------------------------- |
| **C** | Context        | "Projeto Python 3.12, FastAPI, async, PostgreSQL"         |
| **R** | Role           | "Aja como um engenheiro backend sênior"                   |
| **I** | Instructions   | "Implemente o PaymentService para passar todos os testes" |
| **S** | Specifications | "Respeite idempotência, limites e eventos de domínio"     |
| **P** | Polish         | "Use type hints, docstrings e siga PEP 8"                 |

### Exemplo — Prompt para o agente IA

```
Contexto: Projeto Python 3.12 com FastAPI e SQLAlchemy async.
Os testes estão em tests/test_payment_service.py.

Implemente app/payments/service.py com a classe PaymentService que:
1. Recebe PaymentGateway, UserRepository e EventBus no construtor
2. Método async process(request: PaymentRequest) -> PaymentResult
3. Verifica limite diário antes de cobrar
4. Garante idempotência via request_id (use um dict em memória por ora)
5. Publica evento PaymentConfirmed após cobrança bem-sucedida
6. Limites: PIX = 5000, Cartão = 10000

Rode pytest após implementar. Todos os testes devem passar.
```

### Resultado gerado pela IA

```python
# app/payments/service.py
from datetime import datetime, timezone
from dataclasses import dataclass
from app.payments.models import (
    PaymentRequest, PaymentResult,
    PaymentMethod, PaymentStatus
)


@dataclass
class DomainEvent:
    name: str
    data: dict


class PaymentService:
    DAILY_LIMITS = {
        PaymentMethod.PIX: 5_000.00,
        PaymentMethod.CREDIT_CARD: 10_000.00,
    }

    def __init__(self, gateway, user_repo, event_bus):
        self._gateway = gateway
        self._user_repo = user_repo
        self._event_bus = event_bus
        self._processed: dict[str, PaymentResult] = {}

    async def process(self, request: PaymentRequest) -> PaymentResult:
        # Idempotência
        if request.request_id in self._processed:
            return self._processed[request.request_id]

        # Verificar limite diário
        daily_spent = await self._user_repo.get_daily_spent(
            request.user_id, request.method
        )
        limit = self.DAILY_LIMITS[request.method]

        if daily_spent + request.amount > limit:
            result = PaymentResult(
                transaction_id=f"pending_{request.request_id}",
                status=PaymentStatus.PENDING_APPROVAL,
                timestamp=datetime.now(timezone.utc),
            )
            self._processed[request.request_id] = result
            return result

        # Cobrar via gateway
        transaction_id = await self._gateway.charge(
            user_id=request.user_id,
            amount=request.amount,
            method=request.method.value,
        )

        result = PaymentResult(
            transaction_id=transaction_id,
            status=PaymentStatus.CONFIRMED,
            timestamp=datetime.now(timezone.utc),
        )

        # Publicar evento
        await self._event_bus.publish(
            DomainEvent(
                name="PaymentConfirmed",
                data={
                    "transaction_id": transaction_id,
                    "user_id": request.user_id,
                    "amount": request.amount,
                },
            )
        )

        self._processed[request.request_id] = result
        return result
```

### Ciclo de feedback

```
Dev comanda ──▶ IA gera código ──▶ pytest roda ──▶ Falhou?
                                                      │
                                        Sim: IA corrige automaticamente
                                        Não: próximo passo ✓
```

---

## Passo 5 — Entender (Ler o Código, Saber o Impacto)

### O desenvolvedor como revisor

A IA gerou o código, mas **o desenvolvedor é responsável por ele**. Este passo é sobre leitura crítica e análise de
impacto.

### Checklist de revisão pós-IA

```python
# review_checklist.py — Automação da checklist de revisão

REVIEW_CHECKLIST = {
    "segurança": [
        "SQL injection — queries parametrizadas?",
        "Credenciais hardcoded no código?",
        "Inputs do usuário validados e sanitizados?",
        "Rate limiting implementado nos endpoints?",
    ],
    "performance": [
        "N+1 queries detectadas?",
        "Índices de banco necessários criados?",
        "Operações bloqueantes em código async?",
        "Cache utilizado onde faz sentido?",
    ],
    "manutenibilidade": [
        "Código segue os padrões do projeto?",
        "Dependências fantasma (imports não existentes)?",
        "Tratamento de erro consistente?",
        "Testes cobrem edge cases reais?",
    ],
    "impacto": [
        "Quais módulos são afetados pela mudança?",
        "Migrações de banco necessárias?",
        "Contratos de API modificados (breaking change)?",
        "Variáveis de ambiente novas adicionadas?",
    ],
}


def run_review(changed_files: list[str]) -> dict:
    """Gera relatório de revisão para arquivos alterados."""
    report = {}
    for category, checks in REVIEW_CHECKLIST.items():
        report[category] = {
            check: "⬜ pendente" for check in checks
        }
    report["files_changed"] = changed_files
    return report


# Uso:
# report = run_review(["app/payments/service.py"])
# Desenvolvedor marca cada item como ✅ ou ❌
```

### Análise de impacto com IA

Peça à IA para mapear dependências:

```
Analise app/payments/service.py e me diga:
1. Quais módulos importam ou dependem deste arquivo?
2. Quais rotas da API são afetadas?
3. Preciso de migração de banco?
4. Algum contrato de API mudou?
```

### Métricas de revisão com IA (dados de mercado 2026)

| Métrica                   | Sem IA          | Com IA |
| ------------------------- | --------------- | ------ |
| Taxa de detecção de bugs  | < 20%           | 42-48% |
| Tempo médio de revisão    | 60 min          | 25 min |
| Bugs em produção (mensal) | 100% (baseline) | -62%   |

---

## Passo 6 — Interface

### IA como acelerador de frontend

A IA reduz em **50%** o tempo de tarefas repetitivas de UI (formulários, tabelas, layouts responsivos) e **30-40%** em
debugging de CSS/JS.

### Exemplo Python (FastAPI + Jinja2) — Gerando endpoint e template

```python
# app/payments/router.py
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter(prefix="/payments", tags=["payments"])
templates = Jinja2Templates(directory="templates")


@router.get("/new", response_class=HTMLResponse)
async def payment_form(request: Request):
    return templates.TemplateResponse(
        "payments/form.html",
        {
            "request": request,
            "methods": ["PIX", "Cartão de Crédito"],
            "limits": {"PIX": 5000, "Cartão de Crédito": 10000},
        },
    )


@router.post("/process")
async def process_payment(request: Request):
    form = await request.form()
    # Validação e processamento...
    return templates.TemplateResponse(
        "payments/result.html",
        {"request": request, "status": "confirmed"},
    )
```

### Prompt para gerar componente React (projetos frontend)

```
Crie um componente React TypeScript para formulário de pagamento:
- Campos: valor (currency input), método (PIX ou Cartão)
- Mostrar limite restante baseado no método selecionado
- Validação client-side antes do submit
- Acessível (WCAG 2.1 AA): labels, aria-attributes, focus management
- Responsivo: mobile-first com Tailwind CSS
- Testes com React Testing Library
```

### O que a IA faz bem no frontend

| Tarefa                | Qualidade IA   | Revisão humana  |
| --------------------- | -------------- | --------------- |
| Formulários CRUD      | Excelente      | Baixa           |
| Layouts responsivos   | Boa            | Média           |
| Animações complexas   | Média          | Alta            |
| UX/fluxo do usuário   | Fraca          | Obrigatória     |
| Acessibilidade (a11y) | Boa (mecânica) | Alta (contexto) |

---

## Passo 7 — Otimizar

### Refatoração guiada por métricas

Otimização sem métricas é chute. Meça primeiro, otimize depois, meça de novo.

### Exemplo Python — Profiling antes de otimizar

```python
# scripts/benchmark_payment.py
import asyncio
import time
import statistics
from app.payments.service import PaymentService
from app.payments.models import PaymentRequest, PaymentMethod


async def benchmark(service: PaymentService, n: int = 1000):
    """Mede latência do processamento de pagamentos."""
    times = []

    for i in range(n):
        request = PaymentRequest(
            user_id="bench_user",
            amount=10.00,
            method=PaymentMethod.PIX,
            request_id=f"bench_{i}",
        )
        start = time.perf_counter()
        await service.process(request)
        elapsed = (time.perf_counter() - start) * 1000  # ms
        times.append(elapsed)

    return {
        "p50": statistics.median(times),
        "p95": sorted(times)[int(n * 0.95)],
        "p99": sorted(times)[int(n * 0.99)],
        "mean": statistics.mean(times),
        "total_requests": n,
    }


async def main():
    # setup service com mocks ou conexões reais...
    service = PaymentService(gateway, user_repo, event_bus)
    results = await benchmark(service)

    print("=== Benchmark de Pagamentos ===")
    for key, value in results.items():
        if isinstance(value, float):
            print(f"  {key}: {value:.2f} ms")
        else:
            print(f"  {key}: {value}")


if __name__ == "__main__":
    asyncio.run(main())
```

### Prompt para otimização com IA

```
Analise app/payments/service.py para otimização:
1. Identifique gargalos de performance
2. Sugira uso de cache para consultas repetidas
3. Verifique se operações I/O estão sendo paralelizadas
4. Proponha batch processing onde aplicável

RESTRIÇÃO: todas as otimizações devem manter os testes existentes passando.
Rode pytest antes e depois de cada mudança.
```

### Padrão de otimização segura

```
Testes passam ──▶ Benchmark (antes) ──▶ IA otimiza ──▶ Testes passam?
                                                            │
                                              Não: reverte (git checkout)
                                              Sim: Benchmark (depois)
                                                            │
                                              Melhorou? Mantém ✓
                                              Piorou? Reverte ✗
```

---

## Passo 8 — Deploy

### Pipeline CI/CD com IA integrada

```
Push ──▶ Lint/Format ──▶ Testes ──▶ Security Scan ──▶ Build ──▶ Deploy
           (ruff)       (pytest)    (trivy/bandit)    (docker)   (staging)
                                                                     │
                                                          Smoke tests passam?
                                                          Sim: promove p/ prod
                                                          Não: rollback automático
```

### Exemplo Python — GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: CI/CD Pipeline

on:
    push:
        branches: [main, develop]
    pull_request:
        branches: [main]

jobs:
    quality:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - uses: actions/setup-python@v5
              with:
                  python-version: "3.12"

            - name: Install dependencies
              run: pip install -r requirements.txt -r requirements-dev.txt

            - name: Lint (ruff)
              run: ruff check . --output-format=github

            - name: Format check (ruff)
              run: ruff format --check .

            - name: Type check (mypy)
              run: mypy app/ --strict

    test:
        needs: quality
        runs-on: ubuntu-latest
        services:
            postgres:
                image: postgres:16
                env:
                    POSTGRES_DB: test_db
                    POSTGRES_PASSWORD: test
                ports: ["5432:5432"]
        steps:
            - uses: actions/checkout@v4

            - uses: actions/setup-python@v5
              with:
                  python-version: "3.12"

            - name: Install dependencies
              run: pip install -r requirements.txt -r requirements-dev.txt

            - name: Run tests with coverage
              run: pytest --cov=app --cov-report=xml --cov-fail-under=80
              env:
                  DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db

    security:
        needs: quality
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - name: Security scan (bandit)
              run: pip install bandit && bandit -r app/ -f json -o security-report.json

            - name: Dependency audit
              run: pip install pip-audit && pip-audit

    deploy-staging:
        needs: [test, security]
        if: github.ref == 'refs/heads/develop'
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - name: Build & push Docker image
              run: |
                  docker build -t app:${{ github.sha }} .
                  docker push registry.example.com/app:${{ github.sha }}

            - name: Deploy to staging
              run: |
                  kubectl set image deployment/app \
                    app=registry.example.com/app:${{ github.sha }}

            - name: Smoke tests
              run: |
                  sleep 10
                  curl -f https://staging.example.com/health || exit 1

    deploy-prod:
        needs: [test, security]
        if: github.ref == 'refs/heads/main'
        runs-on: ubuntu-latest
        environment: production # requer aprovação manual
        steps:
            - uses: actions/checkout@v4

            - name: Deploy com rollback automático
              run: |
                  kubectl set image deployment/app \
                    app=registry.example.com/app:${{ github.sha }}
                  kubectl rollout status deployment/app --timeout=300s || \
                    kubectl rollout undo deployment/app
```

### Estratégia de deploy seguro

| Estratégia         | Quando usar                                 |
| ------------------ | ------------------------------------------- |
| **Blue-Green**     | Troca instantânea, rollback rápido          |
| **Canary**         | Liberar para % pequeno de usuários primeiro |
| **Feature Flags**  | Funcionalidade nova controlada por config   |
| **Rolling Update** | Atualização gradual dos pods/instâncias     |

---

## Resumo: O Fluxo Completo

```
┌──────────────────────────────────────────────────────────┐
│                    CICLO DE DESENVOLVIMENTO               │
│                                                          │
│   ┌─────────┐    ┌──────────┐    ┌─────┐    ┌────────┐  │
│   │ 1.SAFE  │───▶│ 2.DESIGN │───▶│3.TDD│───▶│ 4.CODE │  │
│   │  ENV    │    │  ARCH    │    │     │    │ w/ AI  │  │
│   └─────────┘    └──────────┘    └─────┘    └────────┘  │
│                                                  │       │
│   ┌─────────┐    ┌──────────┐    ┌─────┐    ┌────┴───┐  │
│   │8.DEPLOY │◀───│7.OPTIMIZE│◀───│6. UI│◀───│5.REVIEW│  │
│   │         │    │          │    │     │    │        │  │
│   └─────────┘    └──────────┘    └─────┘    └────────┘  │
│                                                          │
│   Humano decide O QUE ──── IA executa O COMO            │
│   Testes validam ──── Métricas comprovam                │
└──────────────────────────────────────────────────────────┘
```

### Princípios fundamentais

1. **IA é ferramenta, não decisor** — humanos definem arquitetura e regras de negócio
2. **Testes antes do código** — a IA trabalha para passar nos testes, não o contrário
3. **Segurança por padrão** — ambiente isolado desde o primeiro momento
4. **Medir antes e depois** — otimização sem métrica é opinião
5. **Deploy progressivo** — nunca tudo de uma vez, sempre com rollback

---

> _Equipes que seguem este fluxo reportam **40-60% menos tempo** em revisão de código, **62% menos bugs** em produção e
> **ciclos de entrega 3x mais rápidos** — não porque a IA é infalível, mas porque cada passo existe para **capturar
> erros antes que custem caro**._
