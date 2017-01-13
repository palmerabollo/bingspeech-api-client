import * as fs from 'fs';
import * as util from 'util';
import * as uuid from 'uuid';

import { VoiceRecognitionResponse, VoiceSynthesisResponse } from './models';

const request = require('request-promise-native');
const debug = require('debug')('bingspeechclient');

const ASIAN_LOCALES = ['zh-cn', 'zh-hk', 'zh-tw', 'ja-jp'];

const VOICES: { [key: string]: string } = {
    'ar-eg female': 'Microsoft Server Speech Text to Speech Voice (ar-EG, Hoda)',
    'de-de female': 'Microsoft Server Speech Text to Speech Voice (de-DE, Hedda)',
    'de-de male': 'Microsoft Server Speech Text to Speech Voice (de-DE, Stefan, Apollo)',
    'en-au female': 'Microsoft Server Speech Text to Speech Voice (en-AU, Catherine)',
    'en-ca female': 'Microsoft Server Speech Text to Speech Voice (en-CA, Linda)',
    'en-gb female': 'Microsoft Server Speech Text to Speech Voice (en-GB, Susan, Apollo)',
    'en-gb male': 'Microsoft Server Speech Text to Speech Voice (en-GB, George, Apollo)',
    'en-in male': 'Microsoft Server Speech Text to Speech Voice (en-IN, Ravi, Apollo)',
    'en-us female': 'Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)',
    'en-us male': 'Microsoft Server Speech Text to Speech Voice (en-US, BenjaminRUS)',
    'es-es female': 'Microsoft Server Speech Text to Speech Voice (es-ES, Laura, Apollo)',
    'es-es male': 'Microsoft Server Speech Text to Speech Voice (es-ES, Pablo, Apollo)',
    'es-mx male': 'Microsoft Server Speech Text to Speech Voice (es-MX, Raul, Apollo)',
    'fr-ca female': 'Microsoft Server Speech Text to Speech Voice (fr-CA, Caroline)',
    'fr-fr female': 'Microsoft Server Speech Text to Speech Voice (fr-FR, Julie, Apollo)',
    'fr-fr male': 'Microsoft Server Speech Text to Speech Voice (fr-FR, Paul, Apollo)',
    'it-it male': 'Microsoft Server Speech Text to Speech Voice (it-IT, Cosimo, Apollo)',
    'ja-jp female': 'Microsoft Server Speech Text to Speech Voice (ja-JP, Ayumi, Apollo)',
    'ja-jp male': 'Microsoft Server Speech Text to Speech Voice (ja-JP, Ichiro, Apollo)',
    'pt-br male': 'Microsoft Server Speech Text to Speech Voice (pt-BR, Daniel, Apollo)',
    'ru-ru female': 'Microsoft Server Speech Text to Speech Voice (ru-RU, Irina, Apollo)',
    'ru-ru male': 'Microsoft Server Speech Text to Speech Voice (ru-RU, Pavel, Apollo)',
    'zh-cn female': 'Microsoft Server Speech Text to Speech Voice (zh-CN, HuihuiRUS)',
    'zh-cn female': 'Microsoft Server Speech Text to Speech Voice (zh-CN, Yaoyao, Apollo)',
    'zh-cn male': 'Microsoft Server Speech Text to Speech Voice (zh-CN, Kangkang, Apollo)',
    'zh-hk female': 'Microsoft Server Speech Text to Speech Voice (zh-HK, Tracy, Apollo)',
    'zh-hk male': 'Microsoft Server Speech Text to Speech Voice (zh-HK, Danny, Apollo)',
    'zh-tw female': 'Microsoft Server Speech Text to Speech Voice (zh-TW, Yating, Apollo)',
    'zh-tw male': 'Microsoft Server Speech Text to Speech Voice (zh-TW, Zhiwei, Apollo)'
};

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

    synthesize(text: string, locale: string = 'en-us', gender: string = 'female'): Promise<VoiceSynthesisResponse> {
        // see also https://github.com/Microsoft/Cognitive-Speech-TTS/blob/master/Samples-Http/NodeJS/TTSService.js
        return this.issueToken()
            .then((token) => {
                // Access token expires every 10 minutes. Renew it every 9 minutes only.
                // see also http://oxfordportal.blob.core.windows.net/speech/doc/recognition/Program.cs
                this.token = token;
                this.tokenExpirationDate = Date.now() + 9 * 60 * 1000;

                // If locale is Chinese or Japanese, convert to proper Unicode format
                if (ASIAN_LOCALES.indexOf(locale.toLowerCase()) > -1) {
                    text = this.convertToUnicode(text);
                }

                let font = voiceFont(locale, gender);
                if (!font) {
                    throw new Error(`No voice font for lang ${locale} and gender ${gender}`);
                }

                let ssml = `<speak version='1.0' xml:lang='${locale}'>
                            <voice name='${font}' xml:lang='${locale}' xml:gender='${gender}'>${text}</voice>
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
        return message.split('')
                      .map((c) => '&#' + c.charCodeAt(0) + ';')
                      .join('');
    }
}

/**
 * Get the appropriate voice font
 * see https://www.microsoft.com/cognitive-services/en-us/Speech-api/documentation/API-Reference-REST/BingVoiceOutput#SupLocales
 */
function voiceFont(locale: string, gender: string): string {
    let voiceKey = (locale + ' ' + gender).toLowerCase();
    return VOICES[voiceKey];
}
