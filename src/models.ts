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

/**
 * @deprecated Use streaming mode instead. Will be removed in 2.x
 */
export interface VoiceSynthesisResponse {
    wave: Buffer;
}
