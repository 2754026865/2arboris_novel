<!-- AIMETA P=设置页_用户设置|R=用户设置表单|NR=不含管理员设置|E=route:/settings#component:SettingsView|X=ui|A=设置表单|D=vue|S=dom,net|RD=./README.ai -->
<template>
  <div class="min-h-screen md-surface-dim settings-page">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 md:px-6 md:py-8">
      <section class="md-card md-card-elevated settings-overview">
        <div class="settings-overview__top">
          <div class="settings-overview__lead">
            <router-link to="/" class="md-btn md-btn-text md-ripple">
              <span aria-hidden="true">←</span>
              返回
            </router-link>
            <h1 class="md-title-large settings-title">模型设置</h1>
          </div>
          <span class="settings-version-badge" :class="versionStatusClass">
            {{ versionStatusLabel }}
          </span>
        </div>
        <div class="settings-overview__meta">
          <span class="settings-meta-pill">
            <span class="md-label-medium">本地</span>
            <code class="settings-code">{{ localVersion }}</code>
          </span>
          <span class="settings-meta-pill">
            <span class="md-label-medium">远程</span>
            <code class="settings-code">{{ remoteVersion || '未获取' }}</code>
          </span>
          <span class="settings-meta-api">
            <code class="settings-code">/api/llm-config</code>
            <code class="settings-code">/api/updates/remote-version</code>
          </span>
        </div>
      </section>

      <section
        v-if="showInspirationConfigNotice"
        class="md-card settings-notice"
      >
        <p class="md-title-small">灵感模式需要先完成模型配置</p>
        <p class="md-body-small mt-1">
          请先保存 <code class="settings-code">Model</code> 和
          <code class="settings-code">向量 Model</code>，保存后会自动跳回灵感模式。
        </p>
      </section>

      <LLMSettings @saved="handleLLMConfigSaved" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LLMSettings from '@/components/LLMSettings.vue';
import { getRemoteVersion, normalizeComparableVersion, type RemoteVersionDebugEvent } from '@/api/version';

const route = useRoute();
const router = useRouter();
const localVersion = ((import.meta.env.VITE_APP_VERSION as string | undefined)?.trim()) || 'dev';
const remoteVersion = ref<string | null>(null);
const remoteVersionCheckFailed = ref(false);
const isVersionDebugEnabled = import.meta.env.DEV
  || ['1', 'true', 'yes', 'on'].includes(String(import.meta.env.VITE_VERSION_DEBUG || '').trim().toLowerCase());

const hasNewVersion = computed(() => {
  if (!remoteVersion.value) {
    return false;
  }
  return normalizeComparableVersion(remoteVersion.value) !== normalizeComparableVersion(localVersion);
});

const showInspirationConfigNotice = computed(() => (
  route.query.source === 'inspiration' && route.query.reason === 'missing_models'
));

const versionStatusClass = computed(() => {
  if (remoteVersionCheckFailed.value) {
    return 'is-error';
  }
  if (hasNewVersion.value) {
    return 'is-warning';
  }
  return 'is-success';
});

const versionStatusLabel = computed(() => {
  if (remoteVersionCheckFailed.value) {
    return '版本检查失败';
  }
  if (hasNewVersion.value) {
    return '发现新版本';
  }
  return '已是最新';
});

const handleLLMConfigSaved = async () => {
  if (!showInspirationConfigNotice.value) {
    return;
  }
  await router.push('/inspiration');
};

const logVersionDebug = (event: RemoteVersionDebugEvent) => {
  if (!isVersionDebugEnabled) {
    return;
  }
  console.debug('[version-check]', event);
};

onMounted(async () => {
  try {
    remoteVersion.value = await getRemoteVersion(logVersionDebug);
    remoteVersionCheckFailed.value = !remoteVersion.value;
    if (remoteVersionCheckFailed.value) {
      logVersionDebug({
        stage: 'empty_version_result',
        url: String(import.meta.env.VITE_VERSION_CHECK_URL || '/api/updates/remote-version'),
        note: 'request succeeded but parsed version is empty',
      });
    }
  } catch (error) {
    remoteVersionCheckFailed.value = true;
    console.error('Failed to fetch remote version:', error, {
      configuredVersionCheckUrl: String(import.meta.env.VITE_VERSION_CHECK_URL || '').trim() || null,
      localVersion,
    });
  }
});
</script>

<style scoped>
.settings-page {
  background:
    radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--md-primary-container) 45%, transparent) 0%, transparent 35%),
    radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--md-secondary-container) 55%, transparent) 0%, transparent 42%);
}

.settings-overview {
  border-radius: var(--md-radius-xl);
  padding: var(--md-spacing-3) var(--md-spacing-4);
}

.settings-overview__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md-spacing-2);
}

.settings-overview__lead {
  display: flex;
  align-items: center;
  gap: var(--md-spacing-2);
}

.settings-title {
  margin: 0;
  color: var(--md-on-surface);
}

.settings-overview__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--md-spacing-1);
  margin-top: var(--md-spacing-2);
}

.settings-meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 26px;
  padding: 0 10px;
  border-radius: var(--md-radius-full);
  border: 1px solid var(--md-outline-variant);
  background-color: var(--md-surface-container-low);
}

.settings-meta-pill .md-label-medium {
  color: var(--md-on-surface-variant);
}

.settings-meta-api {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.settings-meta-api .settings-code {
  border: 1px dashed var(--md-outline-variant);
  border-radius: var(--md-radius-full);
  padding: 2px 8px;
  background: color-mix(in srgb, var(--md-surface-container-low) 80%, white);
}

.settings-code {
  font-family: var(--md-font-mono);
  font-size: 0.78rem;
  color: var(--md-on-surface);
}

.settings-version-badge {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  border-radius: var(--md-radius-full);
  padding: 0 10px;
  font-size: var(--md-label-medium);
  font-weight: 600;
}

.settings-version-badge.is-success {
  background-color: var(--md-success-container);
  color: var(--md-on-success-container);
}

.settings-version-badge.is-warning {
  background-color: var(--md-warning-container);
  color: var(--md-on-warning-container);
}

.settings-version-badge.is-error {
  background-color: var(--md-error-container);
  color: var(--md-on-error-container);
}

.settings-notice {
  border-radius: var(--md-radius-lg);
  padding: var(--md-spacing-4);
  border: 1px solid color-mix(in srgb, var(--md-warning) 35%, var(--md-outline-variant));
  background-color: var(--md-warning-container);
  color: var(--md-on-warning-container);
}

@media (max-width: 768px) {
  .settings-overview__top {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
