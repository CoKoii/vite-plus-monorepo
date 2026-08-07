<script setup lang="ts">
import { Alert } from "antdv-next";
import type { AlertProps } from "antdv-next";

defineProps<AlertProps>();
</script>

<template>
  <Alert v-bind="$props">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps" />
    </template>
  </Alert>
</template>
