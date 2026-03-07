import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

// Google's vendor ID in the IAB Global Vendor List
const GOOGLE_VENDOR_ID = 755;

// TCF v2.3 Purpose IDs
export const TCF_PURPOSES = {
  STORE_ACCESS: 1,       // Store and/or access information on a device
  BASIC_ADS: 2,          // Select basic ads
  AD_PROFILE: 3,         // Create a personalised ads profile
  PERSONALISED_ADS: 4,   // Select personalised ads
  CONTENT_PROFILE: 5,    // Create a personalised content profile
  PERSONALISED_CONTENT: 6, // Select personalised content
  AD_PERFORMANCE: 7,     // Measure ad performance
  CONTENT_PERFORMANCE: 8, // Measure content performance
  MARKET_RESEARCH: 9,    // Apply market research to generate audience insights
  DEVELOP_IMPROVE: 10,   // Develop and improve products
} as const;

// Consent categories mapped to TCF purposes
export type ConsentCategory = "necessary" | "analytics" | "advertising" | "personalization";

export interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  advertising: boolean;
  personalization: boolean;
}

export interface ConsentContextType {
  consent: ConsentState | null;
  hasConsented: boolean;
  showBanner: boolean;
  showPreferences: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (preferences: Omit<ConsentState, "necessary">) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  tcfString: string | null;
}

const CONSENT_STORAGE_KEY = "tcf_consent_v2.3";
const CONSENT_TIMESTAMP_KEY = "tcf_consent_timestamp";
const CONSENT_EXPIRY_DAYS = 365; // 12 months

const ConsentContext = createContext<ConsentContextType | null>(null);

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
}

// Encode a simple bitfield string for TCF compatibility
function encodeTCFString(consent: ConsentState): string {
  const version = "2.3";
  const created = Math.floor(Date.now() / 100);
  const purposeConsents = [
    consent.necessary ? "1" : "0",     // Purpose 1 - Store/access
    consent.advertising ? "1" : "0",    // Purpose 2 - Basic ads
    consent.advertising ? "1" : "0",    // Purpose 3 - Ad profile
    consent.advertising ? "1" : "0",    // Purpose 4 - Personalised ads
    consent.personalization ? "1" : "0", // Purpose 5 - Content profile
    consent.personalization ? "1" : "0", // Purpose 6 - Personalised content
    consent.advertising ? "1" : "0",    // Purpose 7 - Ad performance
    consent.analytics ? "1" : "0",      // Purpose 8 - Content performance
    consent.analytics ? "1" : "0",      // Purpose 9 - Market research
    consent.analytics ? "1" : "0",      // Purpose 10 - Develop/improve
  ].join("");

  // Include Google in disclosed vendors
  const googleDisclosed = consent.advertising ? "1" : "0";

  // Build a simplified TCF-like consent string
  const payload = {
    v: version,
    created,
    purposes: purposeConsents,
    vendorConsent: consent.advertising ? [GOOGLE_VENDOR_ID] : [],
    disclosedVendors: [GOOGLE_VENDOR_ID], // Always disclose Google per TCF 2.3
    googleConsent: googleDisclosed,
  };

  return btoa(JSON.stringify(payload));
}

// Set __tcfapi stub for Google and other TCF-aware scripts
function setTCFApi(consent: ConsentState) {
  const tcfString = encodeTCFString(consent);

  const purposeConsents: Record<number, boolean> = {
    1: consent.necessary,
    2: consent.advertising,
    3: consent.advertising,
    4: consent.advertising,
    5: consent.personalization,
    6: consent.personalization,
    7: consent.advertising,
    8: consent.analytics,
    9: consent.analytics,
    10: consent.analytics,
  };

  const vendorConsents: Record<number, boolean> = {
    [GOOGLE_VENDOR_ID]: consent.advertising,
  };

  const tcData = {
    tcString: tcfString,
    tcfPolicyVersion: 4,
    cmpId: 1, // Custom CMP
    cmpVersion: 1,
    gdprApplies: true,
    eventStatus: "useractioncomplete",
    cmpStatus: "loaded",
    listenerId: undefined as number | undefined,
    isServiceSpecific: true,
    useNonStandardTexts: false,
    purposeOneTreatment: false,
    publisherCC: "BR",
    purpose: {
      consents: purposeConsents,
      legitimateInterests: {},
    },
    vendor: {
      consents: vendorConsents,
      legitimateInterests: {},
    },
    disclosedVendors: {
      [GOOGLE_VENDOR_ID]: true,
    },
  };

  type TCFCallback = (data: typeof tcData | boolean, success: boolean) => void;
  const listeners = new Map<number, TCFCallback>();
  let nextListenerId = 1;

  (window as any).__tcfapi = function (
    command: string,
    version: number,
    callback: TCFCallback,
    parameter?: any
  ) {
    switch (command) {
      case "getTCData":
        callback(tcData, true);
        break;
      case "ping":
        callback(
          {
            ...tcData,
            cmpLoaded: true,
            cmpStatus: "loaded",
            displayStatus: "hidden",
            apiVersion: "2.3",
            cmpId: 1,
          } as any,
          true
        );
        break;
      case "addEventListener": {
        const id = nextListenerId++;
        listeners.set(id, callback);
        callback({ ...tcData, listenerId: id, eventStatus: "tcloaded" } as any, true);
        break;
      }
      case "removeEventListener":
        if (parameter) listeners.delete(parameter);
        callback(true, true);
        break;
      default:
        callback(false as any, false);
    }
  };

  // Signal to Google that TCF is ready
  (window as any).__tcfapi.a = [];

  // Notify existing listeners
  listeners.forEach((cb, id) => {
    cb({ ...tcData, listenerId: id, eventStatus: "useractioncomplete" } as any, true);
  });
}

function isConsentExpired(): boolean {
  const timestamp = localStorage.getItem(CONSENT_TIMESTAMP_KEY);
  if (!timestamp) return true;
  const elapsed = Date.now() - parseInt(timestamp, 10);
  return elapsed > CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [tcfString, setTcfString] = useState<string | null>(null);

  // Load saved consent
  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (saved && !isConsentExpired()) {
      try {
        const parsed = JSON.parse(saved) as ConsentState;
        setConsent(parsed);
        setTcfString(encodeTCFString(parsed));
        setTCFApi(parsed);
      } catch {
        setShowBanner(true);
      }
    } else {
      // Set up TCF API stub before banner shows (required by Google)
      const defaultDenied: ConsentState = {
        necessary: true,
        analytics: false,
        advertising: false,
        personalization: false,
      };
      setTCFApi(defaultDenied);
      const timer = setTimeout(() => setShowBanner(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const persistConsent = useCallback((state: ConsentState) => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, Date.now().toString());
    // Remove old cookie consent key
    localStorage.removeItem("cookie-consent-accepted");
    setConsent(state);
    setTcfString(encodeTCFString(state));
    setTCFApi(state);
    setShowBanner(false);
    setShowPreferences(false);
  }, []);

  const acceptAll = useCallback(() => {
    persistConsent({ necessary: true, analytics: true, advertising: true, personalization: true });
  }, [persistConsent]);

  const rejectAll = useCallback(() => {
    persistConsent({ necessary: true, analytics: false, advertising: false, personalization: false });
  }, [persistConsent]);

  const savePreferences = useCallback(
    (prefs: Omit<ConsentState, "necessary">) => {
      persistConsent({ necessary: true, ...prefs });
    },
    [persistConsent]
  );

  const openPreferences = useCallback(() => setShowPreferences(true), []);
  const closePreferences = useCallback(() => setShowPreferences(false), []);

  return (
    <ConsentContext.Provider
      value={{
        consent,
        hasConsented: consent !== null,
        showBanner,
        showPreferences,
        acceptAll,
        rejectAll,
        savePreferences,
        openPreferences,
        closePreferences,
        tcfString,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}
