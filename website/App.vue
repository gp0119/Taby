<template>
  <div class="flex min-h-screen flex-col">
    <Header />
    <HeroSection />
    <FeaturesSection />
    <ClickToBookmarkSection />
    <KeyReasonsSection />
    <ComparisonSection />
    <CTASection />
    <Footer />
  </div>
</template>

<script setup>
import Header from "./src/components/Header.vue"
import HeroSection from "./src/components/HeroSection.vue"
import FeaturesSection from "./src/components/FeaturesSection.vue"
import ClickToBookmarkSection from "./src/components/ClickToBookmarkSection.vue"
import KeyReasonsSection from "./src/components/KeyReasonsSection.vue"
import ComparisonSection from "./src/components/ComparisonSection.vue"
import CTASection from "./src/components/CTASection.vue"
import Footer from "./src/components/Footer.vue"

// No script logic needed for App.vue itself anymore
</script>
