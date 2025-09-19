# 디딤돌(didimdol) 시스템 아키텍처(요약)

본 문서는 전체 아키텍처 개요만 제공합니다. 세부 문서는 아래 링크를 참고하세요.

- [UX 디자인](./UX-DESIGN.md)
---

## 🏗️ 전체 아키텍처 개요

### 한눈에 보기(간단)
```mermaid
flowchart TB
  subgraph 경계
    U[사용자]
    ZTNA[ZTNA 게이트웨이]
    ING[프라이빗 인그레스]
    ENTRA[Entra ID]
  end
  subgraph 사내망
    UI[웹 UI]
    ORCH[MCP Orchestrator]
    REDIS[Redis Session Cache]
    
    subgraph Azure서비스
      KV[Key Vault]
      subgraph Storage
        PG[Postgres]
        subgraph 스키마
          JSC[Jira 스키마]
          CSC[Confluence 스키마]
          GSC[GitHub 스키마]
          TSC[Teams 스키마]
          WSC[Wiki 스키마]
          SSC[공용 스키마]
        end
        BLOB[Blob 스토리지]
      end
      
      subgraph SecOps
        DEF[Defender]
        SEN[Sentinel]
        POL[Azure Policy]
        PUR[Purview]
      end
    end
    
    subgraph MCP오케스트레이션
      subgraph AKSMCP[AKS MCP Fleet]
        JMCP[Jira MCP]
        CMCP[Confluence MCP]
        GMCP[GitHub MCP]
        TMCP[Teams MCP]
        WMCP[Wiki MCP]
      end
      
      subgraph LLM
        GW[오케스트레이터 LLM 게이트웨이]
        PE[Private Endpoint]
        AOAI[Azure OpenAI]
      end
    end
  end
  
  subgraph 외부통합
    SAAS[Jira · Confluence · GitHub · Teams · DevSpace]
    API[API Endpoint]
  end
  
  U --> ZTNA
  ZTNA --> ING
  ING --> UI
  UI <--> ORCH
  UI -. OIDC .-> ENTRA
  ORCH -. Managed Identity .-> KV
  ORCH --> REDIS
  ORCH -->|N회 호출/집계| AKSMCP
  ORCH --> GW
  GW --> PE
  PE --> AOAI
  AKSMCP --> PG
  AKSMCP --> BLOB
  AKSMCP -. 외부 API .-> SAAS
  SAAS --> API
  API --> ING
  ORCH -. 진단/경보 .-> DEF
  ORCH -. 로그/규정 .-> SEN
  ORCH -. 거버넌스 .-> POL
  PG -. 데이터 맵/분류 .-> PUR
  BLOB -. 데이터 맵/분류 .-> PUR
```

> 상태 표기
> - Teams 회의 수집/요약: 설계 반영(문서/다이어그램), 백엔드 미구현
> - LLM 기반 템플릿/Q&A: 설계 반영(오케스트레이터 경유), 구현 일부 또는 미구현

### 자세히 보기

### 핵심 설계 원칙
1. MCP는 도메인 어댑터. **LLM 호출은 오케스트레이터 전용**.
2. **스키마 분리** 우선. 트래픽 증가 시 번들 DB로 분리.
3. **3LO 사용자 위임**을 기본 권한 모델로 사용.
4. 토큰은 **DB 저장 + KV 키로 봉투암호화**.
5. SaaS egress는 **NAT/Firewall FQDN 화이트리스트**.
6. Teams는 **Webhook→Queue→Ingestion MCP**.
7. AOAI/DB/Blob **Private Endpoint + Private DNS**.

### 시스템 아키텍처 다이어그램(자세히 보기)

```mermaid
graph TB
  subgraph 경계
    U[사용자]
    ZTNA[ZTNA 게이트웨이]
    ING[프라이빗 인그레스]
  end
  
  subgraph 사내망
    UI[웹 UI]
    ORCH[MCP Orchestrator]
    REDIS[Redis Session Cache]
    
    subgraph Azure서비스
      KV[Key Vault]
      
      subgraph Storage
        PG[Postgres]
        subgraph 스키마
          JSC[Jira 스키마]:::s
          CSC[Confluence 스키마]:::s
          GSC[GitHub 스키마]:::s
          TSC[Teams 스키마]:::s
          WSC[Wiki 스키마]:::s
          SSC[공용 스키마]:::s
        end
        BLOB[Blob 스토리지]
      end
      
      subgraph SecOps
        DEF[Defender]:::ops
        SEN[Sentinel]:::ops
        POL[Azure Policy]:::ops
        PUR[Purview]:::ops
      end
    end
    
    subgraph MCP오케스트레이션
      subgraph AKSMCP[AKS MCP Fleet]
        JMCP[Jira MCP]:::mcp
        CMCP[Confluence MCP]:::mcp
        GMCP[GitHub MCP]:::mcp
        TMCP[Teams MCP]:::mcp
        WMCP[Wiki MCP]:::mcp
      end
      
      subgraph LLM
        GW[오케스트레이터 LLM 게이트웨이]
        PE[Private Endpoint]
        AOAI[Azure OpenAI]
      end
    end
  end
  
  subgraph 외부통합
    SAAS[Jira · Confluence · GitHub · Teams · DevSpace]
    API[API Endpoint]
    ENTRA[Microsoft Entra ID]
  end
  
  classDef s fill:#f6f6f6,stroke:#bbb
  classDef mcp fill:#fff3cd,stroke:#d39e00,stroke-width:1.5px
  classDef ops fill:#eef7ff,stroke:#6aa0ff
  
  U --> ZTNA
  ZTNA --> ING
  ING --> UI
  UI <--> ORCH
  UI -. OIDC .-> ENTRA
  ORCH -. Managed Identity .-> KV
  ORCH --> REDIS
  ORCH -->|N회 호출/집계| AKSMCP
  ORCH --> GW
  GW --> PE
  PE --> AOAI
  AKSMCP --> PG
  AKSMCP --> BLOB
  AKSMCP -. 외부 API .-> SAAS
  SAAS --> API
  API --> ING
  ORCH -. 진단/경보 .-> DEF
  ORCH -. 로그/규정 .-> SEN
  ORCH -. 거버넌스 .-> POL
  PG -. 데이터 맵/분류 .-> PUR
  BLOB -. 데이터 맵/분류 .-> PUR
```

---

**문서 정보(요약본)**
- **버전**: v2.0 (MCP 중심 아키텍처 설계서)
- 상세 내용은 상단 링크의 분리 문서를 참고하세요.

### Azure 네이티브 보안 적용(요약)
- **신원/비밀**: Entra ID(OIDC/CA), Managed Identity, Key Vault(PIM/Secretless)
- **네트워크**: VNet 통합, Private Link/Endpoint로 OpenAI/DB/Blob 폐회로화
- **데이터**: CMK 암호화, RBAC, Purview 분류·DLP 연계
- **위협/컴플라이언스**: Defender for Cloud, Microsoft Sentinel, Azure Policy로 기준선/감사 자동화

---