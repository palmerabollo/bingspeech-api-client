import * as fs from 'fs';
import * as uuid from 'node-uuid';

import { VoiceRecognitionResponse } from './models';

const request = require('request-promise-native');
const debug = require('debug')('bingspeechclient');

// Official docs
// https://www.microsoft.com/cognitive-services/en-us/speech-api/documentation/API-Reference-REST/BingVoiceRecognition

export class BingSpeechClient {
    private BING_SPEECH_TOKEN_ENDPOINT = 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken';
    private BING_SPEECH_ENDPOINT = 'https://speech.platform.bing.com/recognize';

    private subscriptionKey: string;

    private token: string;
    private tokenExpirationDate: number;

    /**
      * @constructor
      * @param {string} subscriptionKey Your Bing Speech subscription key.
     */
    constructor(subscriptionKey: string) {
        this.subscriptionKey = subscriptionKey;
    }

    voiceRecognition(wave: Buffer): Promise<VoiceRecognitionResponse> {
        // see also https://nowayshecodes.com/2016/02/12/speech-to-text-with-project-oxford-using-node-js/
        // TODO make locale and content-type configurable
        return this.issueToken().then((token) => {
            // Access token expires every 10 minutes. Renew it every 9 minutes only.
            // see also http://oxfordportal.blob.core.windows.net/speech/doc/recognition/Program.cs
            this.token = token;
            this.tokenExpirationDate = Date.now() + 9 * 60 * 1000;

            let baseRequest = request.defaults({
                qs: {
                    'scenarios': 'ulm',
                    'appid': 'D4D52672-91D7-4C74-8AD8-42B1D98141A5', // magic value as per MS docs
                    'locale': 'en-us',
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

            return baseRequest.post(this.BING_SPEECH_ENDPOINT);
        })
        .then(result => JSON.parse(result))
        .catch((err: Error) => {
            throw new Error(`Voice recognition failed miserably: ${err.message}`);
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
}
