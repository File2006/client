import { defineStore } from 'pinia'
import { ref } from 'vue'

//Definuje úložiště pro ukládání reaktivných proměnných
export const useComponentRefsStore = defineStore('componentRefs', () => {
    const targetDistance = ref(50)
    return {targetDistance}
})