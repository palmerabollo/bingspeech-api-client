export interface VoiceRecognitionResponse {
    version: string;
    header: {
        status: string;
        scenario: string;
        name: string;
        lexical: string;
        properties: {
            requestid: string;
            NOSPEECH?: string;
            FALSERECO?: string;
            HIGHCONF?: string;
            MIDCONF?: string;
            LOWCONF?: string;
        }
    };
    results: {
        scenario: string;
        name: string;
        lexical: string;
        confidence: string;
        properties: {
            NOSPEECH?: string;
            FALSERECO?: string;
            HIGHCONF?: string;
            MIDCONF?: string;
            LOWCONF?: string;
        }
    }[];
};

export interface VoiceSynthesisResponse {
    wave: Buffer;
}
