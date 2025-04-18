import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useComponentRefsStore = defineStore('componentRefs', () => {
    const targetDistance = ref(50)
    return {targetDistance}
})