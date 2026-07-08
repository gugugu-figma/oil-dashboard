<template>
  <section class="section">
    <h2>
      <span>{{ title }}</span>
      <slot name="actions" />
    </h2>
    <div class="section-body">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  }
})
</script>
