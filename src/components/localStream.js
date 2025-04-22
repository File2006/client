let localStream = null;

// Získání videoaudio záznamu uživatele
export async function getLocalStream() {
    if (!localStream) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (error) {
            console.error('Error accessing media devices:', error);
        }
    }
    return localStream;
}