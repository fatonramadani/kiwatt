/**
 * Smart Device Recommendation Engine
 *
 * Generates personalized recommendations for home devices based on
 * current surplus and forecasted production.
 */

import type { HourlyForecast, OptimalWindow } from "./forecast";

export type DeviceType = "ev_charger" | "battery" | "washing_machine" | "dishwasher" | "heat_pump" | "generic";

export type ActionType =
  | "start_charging"
  | "stop_charging"
  | "charge"
  | "discharge"
  | "hold"
  | "start_now"
  | "delay"
  | "reduce_power"
  | "increase_power"
  | "no_action";

export interface DeviceRecommendation {
  action: ActionType;
  reason: string;
  optimalUntil?: string;
  maxPowerKw?: number;
  targetSoc?: number;
  priority: "high" | "medium" | "low";
}

export interface MemberRecommendations {
  memberId: string;
  timestamp: string;
  currentSurplusKw: number;
  devices: Record<DeviceType, DeviceRecommendation>;
  summary: string;
}

// Power consumption estimates for devices (in kW)
const DEVICE_POWER: Record<DeviceType, number> = {
  ev_charger: 7.4,      // Typical home charger
  battery: 5.0,         // Home battery charge rate
  washing_machine: 2.0, // Washing machine
  dishwasher: 1.5,      // Dishwasher
  heat_pump: 3.0,       // Heat pump
  generic: 1.0,         // Generic device
};

// Surplus thresholds for recommendations
const THRESHOLDS = {
  EXCELLENT: 5.0,  // kW - can charge EV at full speed
  GOOD: 2.0,       // kW - can run large appliances
  MODERATE: 1.0,   // kW - can run small appliances
  BALANCED: 0.0,   // kW - equilibrium
};

/**
 * Generate recommendations for all device types
 */
export function generateRecommendations(
  memberId: string,
  currentSurplusKw: number,
  forecast: HourlyForecast[],
  optimalWindows: OptimalWindow[]
): MemberRecommendations {
  const now = new Date();
  const currentHour = now.getHours();

  // Find the next optimal window if we're not currently in one
  const nextWindow = optimalWindows.find((w) => {
    const startHour = parseInt(w.start.split(":")[0]!);
    return startHour > currentHour;
  });

  const currentWindow = optimalWindows.find((w) => {
    const startHour = parseInt(w.start.split(":")[0]!);
    const endHour = parseInt(w.end.split(":")[0]!);
    return currentHour >= startHour && currentHour < endHour;
  });

  const devices: Record<DeviceType, DeviceRecommendation> = {
    ev_charger: generateEvChargerRecommendation(currentSurplusKw, currentWindow, nextWindow),
    battery: generateBatteryRecommendation(currentSurplusKw, currentWindow, forecast),
    washing_machine: generateApplianceRecommendation("washing_machine", currentSurplusKw, currentWindow, nextWindow),
    dishwasher: generateApplianceRecommendation("dishwasher", currentSurplusKw, currentWindow, nextWindow),
    heat_pump: generateHeatPumpRecommendation(currentSurplusKw, currentWindow),
    generic: generateGenericRecommendation(currentSurplusKw),
  };

  const summary = generateSummary(currentSurplusKw, currentWindow, nextWindow);

  return {
    memberId,
    timestamp: now.toISOString(),
    currentSurplusKw: Math.round(currentSurplusKw * 10) / 10,
    devices,
    summary,
  };
}

/**
 * EV Charger recommendations
 */
function generateEvChargerRecommendation(
  surplusKw: number,
  currentWindow: OptimalWindow | undefined,
  nextWindow: OptimalWindow | undefined
): DeviceRecommendation {
  const evPower = DEVICE_POWER.ev_charger;

  if (surplusKw >= THRESHOLDS.EXCELLENT) {
    return {
      action: "start_charging",
      reason: `${surplusKw.toFixed(1)} kW surplus - charge at full power`,
      maxPowerKw: Math.min(surplusKw, evPower),
      optimalUntil: currentWindow?.end,
      priority: "high",
    };
  }

  if (surplusKw >= THRESHOLDS.GOOD) {
    return {
      action: "start_charging",
      reason: `${surplusKw.toFixed(1)} kW surplus available`,
      maxPowerKw: Math.min(surplusKw, evPower),
      optimalUntil: currentWindow?.end,
      priority: "medium",
    };
  }

  if (surplusKw >= THRESHOLDS.MODERATE) {
    return {
      action: "start_charging",
      reason: "Low surplus - charge at reduced power",
      maxPowerKw: surplusKw,
      priority: "low",
    };
  }

  if (nextWindow) {
    return {
      action: "delay",
      reason: `Wait for optimal window at ${nextWindow.start}`,
      optimalUntil: nextWindow.start,
      priority: "medium",
    };
  }

  return {
    action: "stop_charging",
    reason: "No surplus - drawing from grid",
    priority: "high",
  };
}

/**
 * Home battery recommendations
 */
function generateBatteryRecommendation(
  surplusKw: number,
  currentWindow: OptimalWindow | undefined,
  forecast: HourlyForecast[]
): DeviceRecommendation {
  const now = new Date();
  const currentHour = now.getHours();

  // Check if there's surplus expected later today
  const futureProduction = forecast
    .filter((f) => f.hour > currentHour)
    .reduce((sum, f) => sum + Math.max(0, f.expectedSurplusKw), 0);

  if (surplusKw >= THRESHOLDS.GOOD) {
    return {
      action: "charge",
      reason: `${surplusKw.toFixed(1)} kW surplus - charge battery`,
      targetSoc: 80,
      maxPowerKw: Math.min(surplusKw, DEVICE_POWER.battery),
      optimalUntil: currentWindow?.end,
      priority: "high",
    };
  }

  if (surplusKw >= THRESHOLDS.MODERATE) {
    return {
      action: "charge",
      reason: "Moderate surplus - charge slowly",
      targetSoc: 60,
      maxPowerKw: surplusKw,
      priority: "medium",
    };
  }

  if (surplusKw < -THRESHOLDS.MODERATE && currentHour >= 17) {
    // Evening deficit - discharge to cover consumption
    return {
      action: "discharge",
      reason: "Evening deficit - use stored energy",
      priority: "high",
    };
  }

  if (futureProduction > 5 && currentHour < 10) {
    // Morning with good forecast - don't discharge yet
    return {
      action: "hold",
      reason: "Hold for expected solar production",
      priority: "low",
    };
  }

  return {
    action: "hold",
    reason: "Balanced - maintain current state",
    priority: "low",
  };
}

/**
 * Generic appliance recommendations (washing machine, dishwasher)
 */
function generateApplianceRecommendation(
  deviceType: "washing_machine" | "dishwasher",
  surplusKw: number,
  currentWindow: OptimalWindow | undefined,
  nextWindow: OptimalWindow | undefined
): DeviceRecommendation {
  const devicePower = DEVICE_POWER[deviceType];
  const deviceName = deviceType === "washing_machine" ? "washing machine" : "dishwasher";

  if (surplusKw >= devicePower) {
    return {
      action: "start_now",
      reason: `Surplus covers ${deviceName} consumption`,
      optimalUntil: currentWindow?.end,
      priority: "high",
    };
  }

  if (surplusKw >= THRESHOLDS.MODERATE) {
    return {
      action: "start_now",
      reason: `Partial solar coverage (${((surplusKw / devicePower) * 100).toFixed(0)}%)`,
      priority: "medium",
    };
  }

  if (nextWindow && nextWindow.avgSurplusKw >= devicePower) {
    return {
      action: "delay",
      reason: `Schedule for ${nextWindow.start} (${nextWindow.avgSurplusKw.toFixed(1)} kW surplus)`,
      optimalUntil: nextWindow.start,
      priority: "medium",
    };
  }

  if (nextWindow) {
    return {
      action: "delay",
      reason: `Wait for better conditions at ${nextWindow.start}`,
      optimalUntil: nextWindow.start,
      priority: "low",
    };
  }

  return {
    action: "delay",
    reason: "No solar surplus - delay if possible",
    priority: "low",
  };
}

/**
 * Heat pump recommendations
 */
function generateHeatPumpRecommendation(
  surplusKw: number,
  currentWindow: OptimalWindow | undefined
): DeviceRecommendation {
  if (surplusKw >= THRESHOLDS.EXCELLENT) {
    return {
      action: "increase_power",
      reason: "Large surplus - pre-heat/cool now",
      maxPowerKw: DEVICE_POWER.heat_pump,
      optimalUntil: currentWindow?.end,
      priority: "high",
    };
  }

  if (surplusKw >= THRESHOLDS.GOOD) {
    return {
      action: "start_now",
      reason: "Good surplus - run at normal power",
      priority: "medium",
    };
  }

  if (surplusKw < -THRESHOLDS.GOOD) {
    return {
      action: "reduce_power",
      reason: "Large deficit - reduce if comfort allows",
      priority: "medium",
    };
  }

  return {
    action: "no_action",
    reason: "Maintain current operation",
    priority: "low",
  };
}

/**
 * Generic device recommendation
 */
function generateGenericRecommendation(surplusKw: number): DeviceRecommendation {
  if (surplusKw >= THRESHOLDS.GOOD) {
    return {
      action: "start_now",
      reason: "Good surplus available",
      maxPowerKw: surplusKw,
      priority: "medium",
    };
  }

  if (surplusKw >= THRESHOLDS.MODERATE) {
    return {
      action: "start_now",
      reason: "Moderate surplus - ok to run low-power devices",
      maxPowerKw: surplusKw,
      priority: "low",
    };
  }

  return {
    action: "delay",
    reason: "No surplus - delay non-essential consumption",
    priority: "low",
  };
}

/**
 * Generate a human-readable summary
 */
function generateSummary(
  surplusKw: number,
  currentWindow: OptimalWindow | undefined,
  nextWindow: OptimalWindow | undefined
): string {
  if (surplusKw >= THRESHOLDS.EXCELLENT) {
    return `Excellent conditions! ${surplusKw.toFixed(1)} kW surplus - ideal for EV charging and high-consumption tasks.`;
  }

  if (surplusKw >= THRESHOLDS.GOOD) {
    return `Good conditions with ${surplusKw.toFixed(1)} kW surplus. Run appliances now.`;
  }

  if (surplusKw >= THRESHOLDS.MODERATE) {
    return `Moderate surplus of ${surplusKw.toFixed(1)} kW. Small appliances recommended.`;
  }

  if (surplusKw > -THRESHOLDS.MODERATE) {
    if (nextWindow) {
      return `Balanced. Better conditions expected at ${nextWindow.start}.`;
    }
    return "Balanced production and consumption.";
  }

  return `Grid consumption mode (${Math.abs(surplusKw).toFixed(1)} kW deficit). Delay high-consumption tasks if possible.`;
}
