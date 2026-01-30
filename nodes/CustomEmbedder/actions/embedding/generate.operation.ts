import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { generateEmbedding } from '../../transport/api';

export const generateDescription: INodeProperties[] = [
	// Text 파라미터 제거 - root node의 컨텍스트에서 가져옴
	// API Key는 credentials에서 관리
];

export async function execute(
	this: IExecuteFunctions,
): Promise<INodeExecutionData[][]> {
	const returnData: INodeExecutionData[] = [];

	try {
		// Root node의 컨텍스트에서 텍스트 가져오기
		// Sub-node는 root node의 컨텍스트에서 데이터를 가져올 수 있음
		const inputData = this.getInputData();
		
		// 입력 데이터가 없으면 에러
		if (!inputData || inputData.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'No input data found. This node must be connected to a root node that provides text data.',
			);
		}

		// 첫 번째 아이템의 텍스트 가져오기 (sub-node는 항상 첫 번째 아이템만 처리)
		const item = inputData[0];
		const text = item.json.text || item.json.content || item.json.data || '';

		// 입력 검증
		if (!text || (typeof text === 'string' && text.trim() === '')) {
			throw new NodeOperationError(
				this.getNode(),
				'Text is required. Please ensure the root node provides text data in "text", "content", or "data" field.',
			);
		}

		// API 호출 (credentials의 authenticate가 자동으로 X-API-KEY 헤더 추가)
		const embedding = await generateEmbedding.call(this, {
			text: typeof text === 'string' ? text : String(text),
		});

		// 결과 반환
		returnData.push({
			json: {
				...item.json,
				embedding,
			},
			pairedItem: item.pairedItem,
		});
	} catch (error) {
		if (this.continueOnFail()) {
			returnData.push({
				json: {},
				error,
			});
		} else {
			if (error.context) {
				throw error;
			}
			throw new NodeOperationError(this.getNode(), error);
		}
	}

	return [returnData];
}
