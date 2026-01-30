import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CustomEmbedderApi implements ICredentialType {
	name = 'customEmbedderApi';
	displayName = 'Custom Embedder API';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-KEY': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://embeddings-api-452977999990.us-west1.run.app',
			url: '/models/fashionclip/predict',
			method: 'POST',
			body: {
				text: 'test',
			},
		},
	};
}
