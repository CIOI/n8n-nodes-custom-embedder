import type { IExecuteFunctions, IHttpRequestOptions, ISupplyDataFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export interface GenerateEmbeddingParams {
	text: string;
}

export async function generateEmbedding(
	this: IExecuteFunctions | ISupplyDataFunctions,
	params: GenerateEmbeddingParams,
): Promise<number[]> {
	const { text } = params;

	// Credentials에서 API Key 가져오기
	const credentials = await this.getCredentials('customEmbedderApi');
	const apiKey = credentials?.apiKey as string;

	if (!apiKey) {
		throw new NodeOperationError(
			this.getNode(),
			'API Key is required. Please configure Custom Embedder API credentials.',
		);
	}

	// 요청 본문 구성
	const requestBody = {
		text,
	};

	// API 호출
	// Credentials의 authenticate가 자동으로 적용되지만, 명시적으로 헤더 추가
	const requestOptions: IHttpRequestOptions = {
		url: 'https://embeddings-api-452977999990.us-west1.run.app/models/fashionclip/predict',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-API-KEY': apiKey,  // 명시적으로 헤더 추가
		},
		body: requestBody,
		json: true,
	};

	const response = await this.helpers.httpRequest(requestOptions);

	// 응답에서 embedding 추출
	if (!response.embedding || !Array.isArray(response.embedding)) {
		throw new NodeOperationError(
			this.getNode(),
			'Invalid response format: embedding array not found',
		);
	}

	return response.embedding;
}
