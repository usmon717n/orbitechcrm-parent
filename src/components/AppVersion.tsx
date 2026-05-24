'use client'

import packageJson from '../../package.json'
import { useI18n } from '@/lib/i18n'

function getVersionLabel() {
  const envVersion = process.env.NEXT_PUBLIC_APP_VERSION?.trim()
  const baseVersion = envVersion || packageJson.version || '0.1.0'
  return baseVersion.startsWith('v') ? baseVersion : `v${baseVersion}`
}

export default function AppVersion() {
  const { t } = useI18n()
  const version = getVersionLabel()

  return (
    <div className="pt-1">
      <p className="text-center text-[11px] leading-5 text-gray-400 dark:text-gray-500">
        {t('settings.versionLabel')}: {version}
      </p>
    </div>
  )
}
