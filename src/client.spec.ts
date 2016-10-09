import { expect } from 'chai';

import { BingSpeechClient, VoiceRecognitionResponse } from './';

import * as nock from 'nock';

describe('Bing Speech API client', () => {
    it('should recognize a voice', () => {
        const mockResponse: VoiceRecognitionResponse = {
              version: '3.0',
              header: {
                  status: 'success',
                  scenario: 'ulm',
                  name: 'i have a dream',
                  lexical: 'i have a dream',
                  properties: {
                      requestid: '862cc972-d1dd-4a76-b0a8-829ecd03c4c3',
                      HIGHCONF: '1'
                  }
              },
              results: [
                  {
                      scenario: 'ulm',
                      name: 'i have a dream',
                      lexical: 'i have a dream',
                      confidence: '0.96075',
                      properties: {
                          HIGHCONF: '1'
                      }
                  }
              ]
        };

        nock('https://api.cognitive.microsoft.com')
            .post('/sts/v1.0/issueToken')
            .reply(200, 'FAKETOKEN');

        nock('https://speech.platform.bing.com')
            .post('/recognize')
            .query(true)
            .reply(200, mockResponse);

        let client = new BingSpeechClient('fakeSubscriptionId');

        let wave = new Buffer('');
        return client.recognize(wave)
            .then((response: VoiceRecognitionResponse) => {
                expect(response).to.eql(mockResponse);
            });
    });
});
