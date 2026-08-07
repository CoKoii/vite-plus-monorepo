<script setup lang="ts">
import { Button } from "antdv-next";
import type { ButtonProps } from "antdv-next";

defineProps<ButtonProps>();
</script>

<template>
  <Button v-bind="$props">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps" />
    </template>
  </Button>
</template>
