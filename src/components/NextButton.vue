
<script setup>
import { peerConnect, generateID, localStream} from './peerConnect';
async function fetchPeerIDs() {
  try {
    const response = await fetch('http://localhost:9000/api/getPeers');
    const data = await response.json();
    console.log('Received peer IDs from backend:', data);
    return data.idList;
  } catch (error) {
    console.error('Error fetching peer IDs:', error);
    return [];
  }
}
async function handlePeerConnection() {
  try {
    const peerIDs = await fetchPeerIDs();
    const destID = await generateID(peerIDs);
    if (destID) {
      await peerConnect(destID, localStream);
    } else {
      console.warn('No valid peer ID available for connection.');
    }
  } catch (error) {
    console.error('Error during peer connection:', error);
  }
}
</script>

<template>
<input type="button" @click="handlePeerConnection()" class="next-button" value="Next" />
</template>

<style scoped>
.next-button {
  background: linear-gradient(to bottom, #6bc38e, #3a915c);
  color: white;
  font-size: 1.6rem;
  font-weight: bold;
  border: none;
  cursor: pointer;
  padding: 3rem;
  width: 100%;
  border-radius: 0.8rem;
  height: 100%;
  text-align: center;
  transition: background 0.3s ease, transform 0.1s ease;
}
.next-button:hover {
  background: linear-gradient(to bottom, rgba(107, 195, 142, 0.8), rgba(58, 145, 92, 0.8));
}

.next-button:active {
  transform: scale(0.95);
}

</style>