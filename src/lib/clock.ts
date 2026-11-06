/**
 * COREvia Banking Real-Time Clock & Indian Financial Centers Engine
 * Architecture: Tier-1 Scheduled Commercial Bank
 * Timezone: Asia/Kolkata (Indian Standard Time - IST, UTC+05:30)
 *
 * Invariant: Changing the active banking center / circle does NOT alter the official
 * Indian Standard Time (IST), as all Indian commercial banking operates on uniform IST.
 * Generates zero external API calls (pure local interval timer).
 */

import { useState, useEffect, useMemo } from 'react';

export interface IndianBankingCity {
  id: string;
  name: string;
  state: string;
  circle: string;
  branchName: string;
  branchCode: string;
  ifsc: string;
  isHeadOffice?: boolean;
}

export const INDIAN_BANKING_CITIES: IndianBankingCity[] = [
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    circle: 'Western Commercial Hub',
    branchName: 'Mumbai Fort Main Branch',
    branchCode: '0104',
    ifsc: 'CRVI0001042',
    isHeadOffice: true,
  },
  {
    id: 'delhi',
    name: 'New Delhi',
    state: 'Delhi NCR',
    circle: 'Northern Zonal Hub',
    branchName: 'Connaught Place Branch',
    branchCode: '0108',
    ifsc: 'CRVI0001085',
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    circle: 'Southern Technology Circle',
    branchName: 'MG Road Flagship Branch',
    branchCode: '0204',
    ifsc: 'CRVI0002046',
  },
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    circle: 'Southern Commercial Circle',
    branchName: 'Mount Road Regional Branch',
    branchCode: '0301',
    ifsc: 'CRVI0003019',
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    circle: 'Eastern Zonal Circle',
    branchName: 'BBD Bagh Heritage Branch',
    branchCode: '0402',
    ifsc: 'CRVI0004022',
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    circle: 'Deccan Commercial Hub',
    branchName: 'HITEC City Corporate Branch',
    branchCode: '0505',
    ifsc: 'CRVI0005051',
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad (GIFT City)',
    state: 'Gujarat',
    circle: 'IFSC Offshore Banking Unit',
    branchName: 'GIFT City International Branch',
    branchCode: '0601',
    ifsc: 'CRVI0006018',
  },
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    circle: 'Western Industrial Hub',
    branchName: 'Shivajinagar Commercial Branch',
    branchCode: '0112',
    ifsc: 'CRVI0001127',
  },
];

export const DEFAULT_BANKING_CITY = INDIAN_BANKING_CITIES[0]; // Mumbai Head Office

export interface BankingClockState {
  now: Date;
  dateFormatted: string;
  timeFormatted: string;
  dayOfWeek: string;
  timezoneLabel: string;
  officialTimezone: string;
  selectedCity: IndianBankingCity;
  setSelectedCityId: (id: string) => void;
}

/**
 * Universal React hook for live institutional clock synchronized to Asia/Kolkata.
 * Runs on a 1-second interval, cleanly unmounted, 0 external network requests.
 */
export function useIndianBankingClock(initialCityId?: string): BankingClockState {
  const [now, setNow] = useState<Date>(() => new Date());

  const [selectedCityId, setSelectedCityIdState] = useState<string>(() => {
    if (initialCityId) return initialCityId;
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('corevia_selected_city');
      if (stored && INDIAN_BANKING_CITIES.some((c) => c.id === stored)) {
        return stored;
      }
    }
    return DEFAULT_BANKING_CITY.id;
  });

  const setSelectedCityId = (id: string) => {
    if (INDIAN_BANKING_CITIES.some((c) => c.id === id)) {
      setSelectedCityIdState(id);
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('corevia_selected_city', id);
        }
      } catch {
        // Storage restricted or disabled
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const selectedCity = useMemo(() => {
    return (
      INDIAN_BANKING_CITIES.find((c) => c.id === selectedCityId) || DEFAULT_BANKING_CITY
    );
  }, [selectedCityId]);

  const dateFormatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(now);
    } catch {
      return now.toDateString();
    }
  }, [now]);

  const dayOfWeek = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
      }).format(now);
    } catch {
      return '';
    }
  }, [now]);

  const timeFormatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
    } catch {
      return now.toTimeString().split(' ')[0];
    }
  }, [now]);

  return {
    now,
    dateFormatted,
    timeFormatted,
    dayOfWeek,
    timezoneLabel: 'IST (UTC+05:30)',
    officialTimezone: 'Asia/Kolkata',
    selectedCity,
    setSelectedCityId,
  };
}

