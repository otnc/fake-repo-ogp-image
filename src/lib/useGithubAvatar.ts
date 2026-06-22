import { useEffect, useState } from "react";

// GitHub のユーザ/Org が存在するかを判定する。
// github.com/{name}.png の画像読み込み成否で見る (API 不使用 = レート制限なし)。
export type AvatarStatus = "idle" | "checking" | "exists" | "missing";

export function useGithubAvatarExists(owner: string): AvatarStatus {
  const [status, setStatus] = useState<AvatarStatus>("idle");

  useEffect(() => {
    const name = owner.trim();
    // owner が変わるたびに判定し直す (結果は画像読込のコールバックで確定)
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!name) {
      setStatus("idle");
      return;
    }
    setStatus("checking");
    /* eslint-enable react-hooks/set-state-in-effect */

    let cancelled = false;
    // 入力中の連続呼び出しを抑えるため少し待つ
    const timer = setTimeout(() => {
      const img = new Image();
      img.onload = () => !cancelled && setStatus("exists");
      img.onerror = () => !cancelled && setStatus("missing");
      img.src = `https://github.com/${encodeURIComponent(name)}.png?size=80`;
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [owner]);

  return status;
}
