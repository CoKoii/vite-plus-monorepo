<script setup lang="ts">
import { AppAlert, AppButton } from "@vite-plus-monorepo/component-ui";

import { useCounterStore } from "@/stores/counter";

const counter = useCounterStore();
</script>

<template>
  <h1>Hello Vue!</h1>
  <AppAlert type="success" title="二次封装组件" description="原生类型提示已生效" show-icon />
  <p>Count: {{ counter.count }}</p>
  <button @click="counter.increment">+1</button>
  <AppButton type="primary">Primary Button</AppButton>
</template>
