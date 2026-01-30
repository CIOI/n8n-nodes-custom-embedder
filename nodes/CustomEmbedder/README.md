# Custom Embedder Sub-Node 만들기 가이드

이 문서는 n8n의 LangChain Cluster nodes 구조에서 Embedding sub-node를 만드는 과정을 설명합니다.

## 목차

1. [개요](#개요)
2. [필수 구조](#필수-구조)
3. [단계별 구현](#단계별-구현)
4. [주요 포인트](#주요-포인트)
5. [문제 해결](#문제-해결)

## 개요

Embedding sub-node는 n8n의 LangChain 구조에서 Vector Store와 같은 root node에 연결되어 텍스트를 embedding 벡터로 변환하는 역할을 합니다.

### Sub-node의 특징

- **독립 실행 불가**: Root node에 연결되어야만 작동
- **`supplyData` 메서드 필수**: Root node에 데이터를 제공하는 메서드
- **입력 없음**: `inputs: []`로 설정
- **특정 출력 타입**: `outputs: [NodeConnectionTypes.AiEmbedding]`

## 필수 구조

### 1. 파일 구조

```
nodes/CustomEmbedder/
├── CustomEmbedder.node.ts      # 메인 노드 파일
├── CustomEmbedder.node.json     # 노드 메타데이터
├── CustomEmbedder.svg          # 아이콘
├── transport/
│   └── api.ts                  # API 호출 로직
└── credentials/
    └── CustomEmbedderApi.credentials.ts  # 인증 설정
```

### 2. 필수 인터페이스

- `INodeType`: 노드 타입 인터페이스
- `ISupplyDataFunctions`: Sub-node 실행 컨텍스트
- `SupplyData`: Root node에 반환할 데이터 형식

## 단계별 구현

### Step 1: 기본 노드 구조 설정

```typescript
import type {
    INodeType,
    INodeTypeDescription,
    ISupplyDataFunctions,
    SupplyData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class CustomEmbedder implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Custom Embedder',
        name: 'customEmbedder',
        icon: 'file:customEmbedder.svg',
        group: ['transform'],
        version: 1,
        // ...
    };
}
```

### Step 2: Inputs와 Outputs 설정

**중요**: Sub-node는 `inputs`가 비어있어야 합니다!

```typescript
inputs: [],  // Sub-node는 입력이 없음
outputs: [
    {
        type: NodeConnectionTypes.AiEmbedding,  // 필수!
        required: true,  // 연결 필수로 표시
    },
],
```

### Step 3: Credentials 설정

```typescript
credentials: [
    {
        name: 'customEmbedderApi',
        required: true,
    },
],
```

### Step 4: Hints 추가 (선택사항)

연결되지 않았을 때 경고 메시지 표시:

```typescript
hints: [
    {
        message: 'This node must be connected to a vector store. Insert one',
        type: 'warning',
        location: 'outputPane',
        displayCondition: '={{!$outputs.ai_embedding}}',
    },
],
```

### Step 5: `supplyData` 메서드 구현

**핵심**: 일반 노드의 `execute` 대신 `supplyData`를 구현해야 합니다!

```typescript
async supplyData(
    this: ISupplyDataFunctions, 
    itemIndex: number
): Promise<SupplyData> {
    // 1. Root node의 컨텍스트에서 텍스트 가져오기
    const inputData = this.getInputData();
    const item = inputData[0];
    const text = item.json.text || item.json.content || item.json.data || '';

    // 2. 입력 검증
    if (!text || text.trim() === '') {
        throw new NodeOperationError(
            this.getNode(),
            'Text is required...',
        );
    }

    // 3. Embedding 생성
    const embedding = await generateEmbedding.call(this, { text });

    // 4. SupplyData 형식으로 반환
    return {
        response: embedding,  // 필수: 실제 데이터
    };
}
```

### Step 6: API 호출 함수 구현

`transport/api.ts`에서 실제 API 호출:

```typescript
export async function generateEmbedding(
    this: IExecuteFunctions | ISupplyDataFunctions,
    params: GenerateEmbeddingParams,
): Promise<number[]> {
    // API 호출 로직
    const response = await this.helpers.httpRequest(requestOptions);
    return response.embedding;
}
```

### Step 7: Credentials 파일 생성

`credentials/CustomEmbedderApi.credentials.ts`:

```typescript
export class CustomEmbedderApi implements ICredentialType {
    name = 'customEmbedderApi';
    displayName = 'Custom Embedder API';
    
    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                'X-API-KEY': '={{$credentials.apiKey}}',  // Bearer가 아닌 커스텀 헤더
            },
        },
    };
}
```

### Step 8: 파일명 규칙

**중요**: 파일명은 반드시 `.node.ts`로 끝나야 합니다!

- ✅ `CustomEmbedder.node.ts` → 빌드 후 `CustomEmbedder.node.js`
- ❌ `CustomEmbedder.ts` → 빌드 후 `CustomEmbedder.js` (잘못됨)

### Step 9: package.json 설정

```json
{
    "n8n": {
        "credentials": [
            "dist/credentials/CustomEmbedderApi.credentials.js"
        ],
        "nodes": [
            "dist/nodes/CustomEmbedder/CustomEmbedder.node.js"
        ]
    }
}
```

## 주요 포인트

### 1. `supplyData` vs `execute`

| 메서드 | 사용 대상 | 반환 형식 |
|--------|----------|----------|
| `execute` | 일반 노드 | `INodeExecutionData[][]` |
| `supplyData` | Sub-node | `SupplyData` |

### 2. Inputs 설정

- **일반 노드**: `inputs: [NodeConnectionTypes.Main]`
- **Sub-node**: `inputs: []` (비어있어야 함!)

### 3. Outputs 설정

- **필수**: `NodeConnectionTypes.AiEmbedding` 타입 사용
- **required: true**: 연결 필수로 표시

### 4. Group 설정

- `group: ['transform']` 사용
- `outputs`에 `AiEmbedding`을 설정하면 자동으로 Embeddings 그룹에 표시됨

### 5. 데이터 가져오기

Sub-node는 root node의 컨텍스트에서 데이터를 가져옵니다:

```typescript
const inputData = this.getInputData();  // Root node의 데이터
const text = inputData[0].json.text;    // 첫 번째 아이템만 처리
```

### 6. Credentials 사용

- Properties에서 직접 받지 않음
- Credentials의 `authenticate`가 자동으로 헤더 추가
- `this.helpers.httpRequest()` 호출 시 자동 적용

## 문제 해결

### 에러: "Node does not have a `supplyData` method defined"

**원인**: `supplyData` 메서드가 없거나 잘못 구현됨

**해결**:
- `supplyData` 메서드 추가
- `ISupplyDataFunctions` 타입 사용
- `SupplyData` 형식으로 반환

### 에러: "Text field not found in input data"

**원인**: Root node에서 텍스트를 제공하지 않음

**해결**:
- Root node가 `text`, `content`, 또는 `data` 필드를 제공하는지 확인
- `getInputData()`로 데이터 확인

### 노드가 Embeddings 그룹에 표시되지 않음

**원인**: Outputs 설정이 잘못됨

**해결**:
- `outputs: [{ type: NodeConnectionTypes.AiEmbedding, required: true }]` 확인
- `group: ['transform']` 설정 확인

### 파일명 에러

**원인**: 파일명이 `.node.ts`로 끝나지 않음

**해결**:
- `CustomEmbedder.node.ts` 형식 사용
- 빌드 후 `CustomEmbedder.node.js`가 생성되는지 확인

## 참고 자료

- [n8n LangChain Code node 문서](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.code/)
- [n8n Sub-nodes 문서](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/)
- [n8n Embeddings 노드 예시](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.embeddingsopenai/)
