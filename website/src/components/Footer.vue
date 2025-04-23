<template>
  <footer
    class="mt-24 rounded-t-2xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white"
  >
    <div
      class="container mx-auto grid grid-cols-1 gap-8 px-6 py-12 md:grid-cols-4"
    >
      <!-- Column 1: Brand & Info -->
      <div class="space-y-4">
        <div class="text-2xl font-bold">Taby</div>
        <p class="text-sm text-indigo-100">Since 2023</p>
        <!-- Update year if needed -->
        <p class="text-sm text-indigo-100">Last update May 2024</p>
        <!-- Update date if needed -->
        <!-- Product Hunt Badge Placeholder -->
        <div class="mt-2 border-t border-indigo-500/50 pt-2">
          <span class="text-sm font-semibold text-indigo-100">
            🏆 Product of the day - 1st
          </span>
        </div>
      </div>

      <!-- Column 2: Account & Legal -->
      <div class="space-y-2">
        <h4 class="mb-3 font-semibold text-indigo-100">Account</h4>
        <a
          href="#"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Log in
        </a>
        <a
          href="#"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Sign up
        </a>
        <a
          href="#"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Pricing
        </a>
        <h4 class="mb-3 mt-4 font-semibold text-indigo-100">Legal</h4>
        <a
          href="#"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Security Principles
        </a>
        <a
          href="#"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Terms of Services
        </a>
        <a
          href="/policy.md"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Privacy Policy
        </a>
      </div>

      <!-- Column 3: Company & Support -->
      <div class="space-y-2">
        <h4 class="mb-3 font-semibold text-indigo-100">Company</h4>
        <a
          href="#"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Join Affiliate Program
        </a>
        <a
          href="#"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Partnership with Influencers
        </a>
        <a
          href="#"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Press Kit
        </a>
        <h4 class="mb-3 mt-4 font-semibold text-indigo-100">Support</h4>
        <a
          href="#"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Taby Community
        </a>
        <a
          href="#"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Help Center
        </a>
        <a
          href="https://github.com/gp0119/Taby/issues"
          target="_blank"
          rel="noopener noreferrer"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Report Issue
        </a>
      </div>

      <!-- Column 4: Download Links -->
      <div class="space-y-2">
        <h4 class="mb-3 font-semibold text-indigo-100">Get Taby</h4>
        <a
          href="#"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Taby for Chrome
        </a>
        <a
          href="#"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Taby for Safari
        </a>
        <a
          href="#"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Taby for Microsoft Edge
        </a>
        <a
          href="#"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Taby for Firefox
        </a>
        <a
          href="#"
          class="block text-sm transition-colors hover:text-indigo-200"
        >
          Taby for Opera
        </a>
        <!-- <a href="#" class="block text-sm hover:text-indigo-200 transition-colors">Taby for iPhone</a> -->
      </div>
    </div>
    <!-- Optional: Copyright line -->
    <div class="mt-8 border-t border-indigo-500/50 py-4 text-center">
      <p class="text-xs text-indigo-200">
        &copy; {{ new Date().getFullYear() }} Taby. All rights reserved.
      </p>
    </div>
  </footer>
</template>

<script setup></script>
