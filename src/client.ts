import * as fs from 'fs';
import * as util from 'util';
import * as uuid from 'uuid';

import { VoiceRecognitionResponse, VoiceSynthesisResponse } from './models';

const request = require('request-promise-native');
const debug = require('debug')('bingspeechclient');

// Official docs
// STT https://www.microsoft.com/cognitive-services/en-us/speech-api/documentation/API-Reference-REST/BingVoiceRecognition
// TTS https://www.microsoft.com/cognitive-services/en-us/speech-api/documentation/api-reference-rest/bingvoiceoutput

export class BingSpeechClient {
    private BING_SPEECH_TOKEN_ENDPOINT = 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken';
    private BING_SPEECH_ENDPOINT_STT = 'https://speech.platform.bing.com/recognize';
    private BING_SPEECH_ENDPOINT_TTS = 'https://speech.platform.bing.com/synthesize';

    private subscriptionKey: string;

    private token: string;
    private tokenExpirationDate: number;

    /**
     * Supported: raw-8khz-8bit-mono-mulaw, raw-16khz-16bit-mono-pcm, riff-8khz-8bit-mono-mulaw, riff-16khz-16bit-mono-pcm
     */
    private AUDIO_OUTPUT_FORMAT = 'riff-8khz-8bit-mono-mulaw';

    /**
      * @constructor
      * @param {string} subscriptionKey Your Bing Speech subscription key.
     */
    constructor(subscriptionKey: string) {
        this.subscriptionKey = subscriptionKey;
    }

    recognize(wave: Buffer, locale: string = 'en-us'): Promise<VoiceRecognitionResponse> {
        // see also https://nowayshecodes.com/2016/02/12/speech-to-text-with-project-oxford-using-node-js/
        // TODO make locale and content-type configurable
        return this.issueToken()
            .then((token) => {
                // Access token expires every 10 minutes. Renew it every 9 minutes only.
                // see also http://oxfordportal.blob.core.windows.net/speech/doc/recognition/Program.cs
                this.token = token;
                this.tokenExpirationDate = Date.now() + 9 * 60 * 1000;

                let baseRequest = request.defaults({
                    qs: {
                        'scenarios': 'ulm',
                        'appid': 'D4D52672-91D7-4C74-8AD8-42B1D98141A5', // magic value as per MS docs
                        'locale': locale,
                        'device.os': '-',
                        'version': '3.0',
                        'format': 'json',
                        'requestid': uuid.v4(), // can be anything
                        'instanceid': uuid.v4() // can be anything
                    },
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'audio/wav; codec="audio/pcm"; samplerate=16000',
                        'Content-Length': wave.byteLength
                    },
                    timeout: 15000,
                    body: wave
                });

                return baseRequest.post(this.BING_SPEECH_ENDPOINT_STT);
            })
            .then(result => JSON.parse(result))
            .catch((err: Error) => {
                throw new Error(`Voice recognition failed miserably: ${err.message}`);
            });
    }

    synthesize(text: string, locale: string = 'en-us'): Promise<VoiceSynthesisResponse> {
        // see also https://github.com/Microsoft/Cognitive-Speech-TTS/blob/master/Samples-Http/NodeJS/TTSService.js
        return this.issueToken()
            .then((token) => {
                // Access token expires every 10 minutes. Renew it every 9 minutes only.
                // see also http://oxfordportal.blob.core.windows.net/speech/doc/recognition/Program.cs
                this.token = token;
                this.tokenExpirationDate = Date.now() + 9 * 60 * 1000;

                // If locale is Chinese or Japanese, convert to proper Unicode format
                let asianLocales: string[] = ['zh-cn', 'zh-hk', 'zh-tw', 'ja-jp'];
                if(asianLocales.indexOf(locale.toLowerCase()) > -1) {
                  text = this.convertToUnicode(text);
                }

                // TODO match name and locale
                let name = 'Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)';
                let gender = 'Female';
                let ssml = `<speak version='1.0' xml:lang='${locale}'>
                            <voice name='${name}' xml:lang='${locale}' xml:gender='${gender}'>${text}</voice>
                            </speak>`;

                let baseRequest = request.defaults({
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/ssml+xml',
                        'Content-Length': ssml.length,
                        'X-Microsoft-OutputFormat': this.AUDIO_OUTPUT_FORMAT,
                        'X-Search-AppId': '00000000000000000000000000000000',
		                    'X-Search-ClientID': '00000000000000000000000000000000',
                        'User-Agent': 'bingspeech-api-client'
                    },
                    timeout: 15000,
                    encoding: null, // return body directly as a Buffer
                    body: ssml
                });

                return baseRequest.post(this.BING_SPEECH_ENDPOINT_TTS);
            })
            .then(result => {
                let response: VoiceSynthesisResponse = {
                    wave: result
                };
                return response;
            })
            .catch((err: Error) => {
                throw new Error(`Voice synthesis failed miserably: ${err.message}`);
            });
    }

    private issueToken(): Promise<string> {
        if (this.token && this.tokenExpirationDate > Date.now()) {
            debug('reusing existing token');
            return Promise.resolve(this.token);
        }

        debug('issue new token for subscription key %s', this.subscriptionKey);

        let baseRequest = request.defaults({
            headers: {
                'Ocp-Apim-Subscription-Key': this.subscriptionKey,
                'Content-Length': 0
            },
            timeout: 5000
        });

        return baseRequest.post(this.BING_SPEECH_TOKEN_ENDPOINT);
    }

    private convertToUnicode(message: string): string {
        return message.split('').map(function(c) {
          return '&#' + c.charCodeAt(0) + ';';
        }).join('');
    }
}
