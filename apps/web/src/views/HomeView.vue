<script setup lang="ts">
import { useCounterStore } from "../stores/counter";

const counter = useCounterStore();
</script>

<template>
  <h1>Hello Vue!</h1>
  <p>Count: {{ counter.count }}</p>
  <button @click="counter.increment">+1</button>
</template>
