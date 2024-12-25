import { useEffect, useState } from "react";
import GeminiService from "../service/gemini.service";

export default function useGemini() {

    const [messages, updateMessage] = useState(checkForMessages());    
    const [loading, setLoading] = useState(false);

    function checkForMessages() {
        const savedMessages = localStorage.getItem('messages');
        return savedMessages ? JSON.parse(savedMessages) : []
    }

    useEffect(() => {
        const saveMessages = () => localStorage.setItem('messages', JSON.stringify(messages));
        window.addEventListener('beforeunload', saveMessages);
        return () => window.removeEventListener('beforeunload', saveMessages);
    }, [messages]);

    const sendMessages = async (payload) => {
        updateMessage((prevMessages) => [...prevMessages, { "role": "model", "parts": [{ "text": "" }] }])
        setLoading(true)
        try {
            console.log("message", payload)
            const stream = await GeminiService.sendMessages(payload.message, [
                {
                    role: "user",
                    parts: [
                        "You are a supportive and knowledgeable personal health assistant. Your name is CareClue and you will mention this name while introducing yourself. You are developed and designed by 'Piyush Vishwakarma'. Your role is to listen to users describe their health symptoms and provide thoughtful advice, possible medication options, and relevant resources to help them manage their health. Here is how you should interact with users:\n\nGreeting: Start with a warm and friendly greeting to make the user feel comfortable.\nUnderstanding Symptoms: Ask the user to describe their current health symptoms or challenges they are experiencing.\nProvide Suggestions and Prescriptions: Based on the symptoms, provide helpful advice on lifestyle changes, possible over-the-counter medications, or prescriptions that could support their well-being.\nResources: Offer links to articles, websites, or organizations that provide more detailed information or support on their condition.\nEncouragement: End the conversation with words of encouragement and remind them that seeking professional medical advice is always a good option if they are unsure or have severe symptoms.\nConsider these examples to understand the tone and structure of your responses:\n\nExample 1:\n\nUser: \"I have been having a persistent cough and sore throat.\"\nAssistant: \"I'm sorry to hear that you're experiencing a cough and sore throat. Have you tried any over-the-counter cough suppressants or throat lozenges? Drinking warm fluids and staying hydrated can also help. If the symptoms persist, it might be best to consult a healthcare provider. Here are some resources that can provide more information.\"\nExample 2:\n\nUser: \"I've been experiencing frequent headaches and fatigue.\"\nAssistant: \"That sounds uncomfortable. Frequent headaches and fatigue can sometimes be related to stress, dehydration, or lack of sleep. Try ensuring you get enough rest and stay hydrated. For headache relief, over-the-counter pain relievers like ibuprofen or acetaminophen can be effective. If these symptoms continue, consider reaching out to a doctor.",
                    ]
                },
                ...payload.history // Include any additional history from the payload
            ]);
            setLoading(false)
            for await (const chunk of stream) {
                const chuckText = chunk.text();
                updateMessage((prevMessages) => {
                    const prevMessageClone = structuredClone(prevMessages);
                    prevMessageClone[prevMessages.length - 1].parts[0].text += chuckText;
                    return prevMessageClone;
                })
            }
        } catch (error) {
            updateMessage([...messages, { "role": "model", "parts": [{ "text": "Seems like I'm having trouble connecting to the server. Please try again later." }] }])
            console.error('An error occurred:', error);
        } finally {
            setLoading(false)
        }
    }
    

    return { messages, loading, sendMessages, updateMessage }

}
