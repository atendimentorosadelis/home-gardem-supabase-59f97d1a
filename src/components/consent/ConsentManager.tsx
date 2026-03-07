import { ConsentBanner } from "./ConsentBanner";
import { ConsentPreferencesModal } from "./ConsentPreferencesModal";

export function ConsentManager() {
  return (
    <>
      <ConsentBanner />
      <ConsentPreferencesModal />
    </>
  );
}
