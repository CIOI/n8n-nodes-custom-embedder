import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionTypes} from 'n8n-workflow';
import { generateEmbedding } from './transport/api';

export class CustomEmbedder implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Custom Embedder',
		name: 'customEmbedder',
		icon: 'file:customEmbedder.svg',
		group: ['transform'],
		version: 1,
		description: 'Custom Embedder',
		defaults: {
			name: 'Custom Embedder',
		},
		inputs: [],
		outputs: [
			{
				type: NodeConnectionTypes.AiEmbedding,
				required: true,
			},
		],
		credentials: [
			{
				name: 'customEmbedderApi',
				required: true,
			},
		],
		hints: [
			{
				message: 'This node must be connected to a vector store. Insert one',
				type: 'warning',
				location: 'outputPane',
				displayCondition: '={{!$outputs.ai_embedding}}',
			},
		],
		properties: [],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		// LangChain Embeddings 인터페이스를 구현한 객체 생성
		// embedQuery와 embedDocuments 메서드를 제공해야 함
		
		const embeddingsInstance = {
			// embedQuery: 단일 텍스트를 embedding으로 변환
			embedQuery: async (text: string): Promise<number[]> => {
				return await generateEmbedding.call(this, { text });
			},
			
			// embedDocuments: 여러 텍스트를 embedding 배열로 변환
			embedDocuments: async (texts: string[]): Promise<number[][]> => {
				const embeddings = await Promise.all(
					texts.map((text) => generateEmbedding.call(this, { text }))
				);
				return embeddings;
			},
		};

		// SupplyData 형식으로 반환
		// response에 LangChain Embeddings 인터페이스를 구현한 객체 반환
		return {
			response: embeddingsInstance,
		};
	}
}
