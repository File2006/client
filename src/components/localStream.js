let localStream = null;

export async function getLocalStream() {
    if (!localStream) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (err) {
            console.error('Error accessing media devices:', err);
            throw err;
        }
    }
    return localStream;
}