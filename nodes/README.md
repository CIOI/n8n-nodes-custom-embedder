# n8n 노드 구조 이해하기

## 핵심 개념: Properties vs Execute 함수

### 1. Properties의 목적

**Properties는 UI 정의입니다** — 사용자가 보는 화면과 입력 필드를 정의합니다.

```typescript
properties: [
    // 1. Resource 선택 (사용자가 "무엇을" 다룰지 선택)
    {
        name: 'resource',  // 이 값이 'contact'로 저장됨
        type: 'options',
        // ...
    },
    
    // 2. Operation 선택 (사용자가 "어떤 작업을" 할지 선택)
    {
        name: 'operation',  // 이 값이 'create'로 저장됨
        displayOptions: {
            show: { resource: ['contact'] }  // UI에서만 조건부 표시
        },
        // ...
    },
    
    // 3. Operation에 필요한 파라미터들
    {
        name: 'email',  // create operation에 필요한 필드
        displayOptions: {
            show: { 
                operation: ['create'],
                resource: ['contact'] 
            }
        },
        // ...
    }
]
```

### 2. Execute 함수의 역할

**Execute 함수는 실제 실행 로직**입니다 — properties에서 읽은 값들을 사용해 실제 작업을 수행합니다.

```typescript
async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // 1. properties에서 사용자가 선택한 값들을 읽어옴
    const resource = this.getNodeParameter('resource', 0) as string;  // 'contact'
    const operation = this.getNodeParameter('operation', 0) as string;  // 'create'
    
    // 2. Resource와 Operation에 따라 분기 처리
    if (resource === 'contact') {
        if (operation === 'create') {
            // Contact 리소스의 Create 작업 수행
            const email = this.getNodeParameter('email', 0) as string;
            // 실제 API 호출: POST /contacts { email: ... }
        } else if (operation === 'get') {
            // Contact 리소스의 Get 작업 수행
        }
    } else if (resource === 'email') {
        if (operation === 'send') {
            // Email 리소스의 Send 작업 수행
        }
    }
}
```

### 3. 왜 같은 레벨에 있는가?

Properties는 UI 정의이기 때문입니다. 실제 종속성은 execute 함수에서 처리됩니다.

```
Properties (UI 정의):
├── resource: 'contact' 선택
├── operation: 'create' 선택  ← displayOptions로 resource에 종속됨 (UI상)
└── email: 'test@email.com' 입력  ← displayOptions로 operation에 종속됨 (UI상)

Execute 함수 (실제 로직):
if (resource === 'contact' && operation === 'create') {
    // Contact 리소스의 Create 작업 실행
    // 여기서 실제 종속성이 처리됨!
}
```

### 4. Email은 무엇인가?

Email은 operation에 필요한 파라미터입니다.

- **Resource**: `contact` (연락처)
- **Operation**: `create` (생성)
- **Email**: `create` operation에 필요한 필드 (연락처를 생성하려면 이메일이 필요)

Python으로 비유하면:

```python
class Contact:
    def create(self, email: str):  # email은 create 메서드의 파라미터
        """연락처 생성"""
        pass
```

n8n에서는:
- `email`은 `create` operation의 파라미터
- `displayOptions`로 `operation === 'create'`일 때만 표시

---

## 실제 구조 예시

### FriendGrid.node.ts 예시

```typescript
export class FriendGrid implements INodeType {
    description: INodeTypeDescription = {
        // ... 기본 설정 ...
        
        properties: [
            // 레벨 1: Resource (무엇을 다룰지)
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                options: [
                    {
                        name: 'Contact',
                        value: 'contact',
                    },
                ],
                default: 'contact',
                required: true,
            },
            
            // 레벨 2: Operation (어떤 작업을 할지) 
            //         - UI상으로는 resource에 종속 (displayOptions)
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                displayOptions: {
                    show: {
                        resource: ['contact'],
                    },
                },
                options: [
                    {
                        name: 'Create',
                        value: 'create',
                        description: 'Create a contact',
                    },
                ],
                default: 'create',
            },
            
            // 레벨 3: Operation 파라미터들 (작업에 필요한 데이터)
            //         - UI상으로는 resource와 operation에 종속
            {
                displayName: 'Email',
                name: 'email',
                type: 'string',
                required: true,
                displayOptions: {
                    show: {
                        operation: ['create'],
                        resource: ['contact'],
                    },
                },
                default: '',
                placeholder: 'name@email.com',
                description: 'Primary email for the contact',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        // 실제 종속성은 여기서 처리됨
        const resource = this.getNodeParameter('resource', 0) as string;
        const operation = this.getNodeParameter('operation', 0) as string;
        
        if (resource === 'contact' && operation === 'create') {
            const email = this.getNodeParameter('email', 0) as string;
            // Contact.create(email) 실행
            // 실제 API 호출 로직
        }
        
        // ...
    }
}
```

### Example.node.ts 예시 (간단한 노드)

```typescript
export class Example implements INodeType {
    description: INodeTypeDescription = {
        // ... 기본 설정 ...
        
        properties: [
            // 간단한 노드는 resource/operation 없이 직접 파라미터 정의
            {
                displayName: 'My String',
                name: 'myString',
                type: 'string',
                default: '',
                placeholder: 'Placeholder value',
                description: 'The description text',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const myString = this.getNodeParameter('myString', 0) as string;
        
        // 간단한 처리 로직
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            items[itemIndex].json.myString = myString;
        }
        
        return [items];
    }
}
```

---

## 정리

1. **Properties = UI 정의** (사용자가 보는 화면)
2. **Execute 함수 = 실제 실행 로직** (실제 작업 수행)
3. **Resource와 Operation이 같은 레벨 = UI 구조일 뿐**, 실제 종속성은 execute에서 처리
4. **Email = Operation의 파라미터** (create operation에 필요한 필드)

Properties는 "설정 화면"이고, Execute 함수는 "실제 실행 코드"입니다.

---

## 두 가지 패턴 비교

### 간단한 노드 (Example.node.ts)
- Resource/Operation 없이 직접 파라미터 정의
- 단일 기능에 적합
- `properties`에 직접 파라미터들 정의

### 복잡한 노드 (FriendGrid.node.ts)
- Resource/Operation 패턴 사용
- 여러 리소스와 작업을 다루는 노드에 적합
- `displayOptions`로 조건부 표시
- `execute` 함수에서 resource와 operation에 따라 분기 처리

# n8n 복잡한 노드 디렉터리 구조 가이드

더 복잡한 노드의 경우, n8n에서는 아래와 같은 디렉터리 구조를 권장합니다.

> 💡 **참고 예시**: Airtable 노드나 Microsoft Outlook 노드를 참고하세요.

---

## 🤔 Python으로 이해하기

n8n의 리소스와 작업 개념을 Python에 비유하면 이해하기 쉽습니다.

### 리소스(Resource) = Python 클래스

**리소스**는 Python의 **클래스**와 비슷합니다. 데이터의 종류나 카테고리를 나타냅니다.

```python
# Python 클래스 예시
class Record:
    """Airtable 레코드를 다루는 클래스"""
    pass

class Message:
    """이메일 메시지를 다루는 클래스"""
    pass
```

n8n에서는:
- `Record` 리소스 = Record 데이터를 다루는 것
- `Message` 리소스 = 이메일 메시지를 다루는 것

### 작업(Operation) = 클래스의 메서드

**작업(Operation)**은 Python 클래스의 **메서드**와 비슷합니다. 각 리소스에 대해 수행할 수 있는 동작입니다.

```python
class Record:
    def create(self):
        """새 레코드 생성"""
        pass
    
    def get(self):
        """레코드 조회"""
        pass
    
    def update(self):
        """레코드 수정"""
        pass
    
    def delete(self):
        """레코드 삭제"""
        pass
```

n8n에서는:
- `create.operation.ts` = `create()` 메서드와 같음
- `get.operation.ts` = `get()` 메서드와 같음

### 디렉터리 구조 = Python 패키지 구조

```
actions/
  └── record/              ← Python의 record 패키지
      ├── record.resource.ts    ← __init__.py (클래스 정의)
      ├── create.operation.ts    ← create.py (create 메서드)
      ├── get.operation.ts      ← get.py (get 메서드)
      └── update.operation.ts   ← update.py (update 메서드)
```

Python으로 표현하면:

```python
# actions/record/__init__.py (record.resource.ts와 비슷)
class Record:
    """Record 리소스 설명"""
    pass

# actions/record/create.py (create.operation.ts와 비슷)
def create():
    """Create 작업의 설명"""
    pass

def execute():
    """실제 실행 로직"""
    # 레코드 생성 코드
    pass

# actions/record/get.py (get.operation.ts와 비슷)
def get():
    """Get 작업의 설명"""
    pass

def execute():
    """실제 실행 로직"""
    # 레코드 조회 코드
    pass
```

### 정리

- **리소스** = 클래스 (데이터 종류)
- **작업** = 메서드 (할 수 있는 동작)
- `resource.ts` = 클래스 정의 파일 (`__init__.py`)
- `operation.ts` = 메서드 구현 파일 (각각의 `.py` 파일)

예를 들어, Airtable 노드에서:
- 리소스: `Record` (클래스)
- 작업들: `create`, `get`, `update`, `delete` (메서드들)

---

## 디렉터리 구조

```
actions/
methods/
transport/
```

---

## 📁 디렉터리별 설명

### 1. `actions/`

리소스(resource)를 나타내는 서브 디렉터리들을 포함합니다.

각 리소스 디렉터리에는 **두 가지 종류의 파일**이 있어야 합니다:

#### 리소스 설명 파일
- **파일명**: `<resourceName>.resource.ts` 또는 `index.ts`
- **역할**: 해당 리소스에 대한 description을 포함

#### Operation 파일
- **파일명 형식**: `<operationName>.operation.ts`
- **필수 export**:
  1. `operation`의 description
  2. `execute` 함수

---

### 2. `methods/` (선택 사항)

**동적 파라미터(dynamic parameters)**를 처리하는 함수들을 포함합니다.

---

### 3. `transport/`

외부 API와의 통신 등 **통신 로직(communication implementation)**을 담당하는 디렉터리입니다.
