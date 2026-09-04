export interface UpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseTitle?: string;
  releaseNotes?: string;
  downloadUrl?: string;
  htmlUrl?: string;
}

const CURRENT_VERSION = '1.0.0';
const GITHUB_REPO = 'reinieltalplacido/notepadEZ';

/**
 * Checks GitHub Releases API to see if a newer version tag exists compared to CURRENT_VERSION.
 */
export async function checkForAppUpdates(): Promise<UpdateInfo> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });

    if (!res.ok) {
      return { updateAvailable: false, currentVersion: CURRENT_VERSION, latestVersion: CURRENT_VERSION };
    }

    const data = await res.json();
    const rawTag = (data.tag_name || '').replace(/^v/i, '').trim();

    if (!rawTag) {
      return { updateAvailable: false, currentVersion: CURRENT_VERSION, latestVersion: CURRENT_VERSION };
    }

    const isNewer = compareSemVer(rawTag, CURRENT_VERSION) > 0;

    const exeAsset = data.assets?.find(
      (a: any) => a.name?.toLowerCase().endsWith('.exe') || a.name?.toLowerCase().includes('setup')
    );

    return {
      updateAvailable: isNewer,
      currentVersion: CURRENT_VERSION,
      latestVersion: rawTag,
      releaseTitle: data.name || `Release v${rawTag}`,
      releaseNotes: data.body || '',
      downloadUrl: exeAsset?.browser_download_url || data.html_url,
      htmlUrl: data.html_url,
    };
  } catch (err) {
    console.warn('Update check failed:', err);
    return { updateAvailable: false, currentVersion: CURRENT_VERSION, latestVersion: CURRENT_VERSION };
  }
}

/**
 * Simple semantic version comparator (v1 > v2 => 1, v1 < v2 => -1, equal => 0)
 */
function compareSemVer(v1: string, v2: string): number {
  const p1 = v1.split('.').map((n) => parseInt(n, 10) || 0);
  const p2 = v2.split('.').map((n) => parseInt(n, 10) || 0);
  const maxLen = Math.max(p1.length, p2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
