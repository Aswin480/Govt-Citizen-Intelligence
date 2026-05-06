import { useState, useCallback } from 'react';

// TypeScript definition for Web Speech API
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

export const useVoiceCommand = (onCommand: (cmd: string) => void) => {
    const [isListening, setIsListening] = useState(false);
    const [lastTranscript, setLastTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const startListening = useCallback(() => {
        const { webkitSpeechRecognition }: IWindow = window as unknown as IWindow;
        const SpeechRecognition = webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Voice control not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            setLastTranscript(transcript);
            onCommand(transcript);
        };

        recognition.onerror = (event: any) => {
            setError(event.error);
            setIsListening(false);
        };

        recognition.start();
    }, [onCommand]);

    return { isListening, lastTranscript, error, startListening };
};
