import type { CalcOp } from "./types";

function num(value: string, label: string, { min = -Infinity, max = Infinity, allowZero = true } = {}): number {
  const parsed = Number(String(value).replace(/,/g, "").trim());
  if (value.trim() === "" || !Number.isFinite(parsed)) throw new Error(`Enter a number for ${label}.`);
  if (parsed < min || parsed > max || (!allowZero && parsed === 0)) throw new Error(`${label} must be ${allowZero ? "at least" : "greater than"} ${min}.`);
  return parsed;
}

export const advancedUnitsOps: Record<string, CalcOp> = {
  "torque-units-converter": {
    fields: [
      { id: "value", label: "Torque Value", type: "number", default: "100" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "nm", choices: [["nm", "Newton-meters (N·m)"], ["lbfft", "Pound-feet (lbf·ft)"], ["lbfin", "Pound-inches (lbf·in)"], ["kgfm", "Kilogram-force meters (kgf·m)"]] }
    ],
    note: "Converts between mechanical engineering torque and tightening specs.",
    compute(v) {
      const val = num(v.value, "Torque");
      let nm = val;
      if (v.fromUnit === "lbfft") nm = val * 1.355818;
      else if (v.fromUnit === "lbfin") nm = val * 0.1129848;
      else if (v.fromUnit === "kgfm") nm = val * 9.80665;
      return {
        results: [
          { label: "Newton-meters (N·m)", value: `${nm.toFixed(2)} N·m`, primary: true },
          { label: "Pound-feet (lbf·ft)", value: `${(nm / 1.355818).toFixed(2)} lbf·ft` },
          { label: "Pound-inches (lbf·in)", value: `${(nm / 0.1129848).toFixed(1)} lbf·in` },
          { label: "Kilogram-meters (kgf·m)", value: `${(nm / 9.80665).toFixed(3)} kgf·m` }
        ]
      };
    }
  },

  "viscosity-units-converter": {
    fields: [
      { id: "value", label: "Viscosity Value", type: "number", default: "1.0" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "cp", choices: [["cp", "Centipoise (cP) (Water at 20°C ≈ 1 cP)"], ["pas", "Pascal-seconds (Pa·s)"], ["poise", "Poise (P)"], ["mPas", "MilliPascal-seconds (mPa·s)"]] }
    ],
    note: "Converts dynamic fluid viscosity units.",
    compute(v) {
      const val = num(v.value, "Viscosity", { min: 0 });
      let pas = val * 0.001; // cP to Pa·s
      if (v.fromUnit === "pas") pas = val;
      else if (v.fromUnit === "poise") pas = val * 0.1;
      else if (v.fromUnit === "mPas") pas = val * 0.001;
      return {
        results: [
          { label: "Centipoise (cP)", value: `${(pas * 1000).toFixed(3)} cP`, primary: true },
          { label: "Pascal-seconds (Pa·s)", value: `${pas.toFixed(6)} Pa·s` },
          { label: "Poise (P)", value: `${(pas * 10).toFixed(4)} P` },
          { label: "MilliPascal-seconds (mPa·s)", value: `${(pas * 1000).toFixed(3)} mPa·s` }
        ]
      };
    }
  },

  "luminous-flux-illuminance-converter": {
    fields: [
      { id: "value", label: "Illuminance Value", type: "number", default: "500" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "lux", choices: [["lux", "Lux (lx = lm/m²)"], ["fc", "Foot-candles (fc = lm/ft²)"], ["phot", "Phot (ph)"]] }
    ],
    note: "Converts light illuminance and photometric workplace standards.",
    compute(v) {
      const val = num(v.value, "Illuminance", { min: 0 });
      let lux = val;
      if (v.fromUnit === "fc") lux = val * 10.76391;
      else if (v.fromUnit === "phot") lux = val * 10000;
      return {
        results: [
          { label: "Lux (lx)", value: `${lux.toFixed(1)} lx`, primary: true },
          { label: "Foot-candles (fc)", value: `${(lux / 10.76391).toFixed(2)} fc` }
        ]
      };
    }
  },

  "automotive-fuel-economy-converter": {
    fields: [
      { id: "value", label: "Fuel Economy Value", type: "number", default: "30" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "mpgus", choices: [["mpgus", "Miles Per Gallon US (MPG)"], ["l100km", "Liters per 100 km (L/100km)"], ["kml", "Kilometers per Liter (km/L)"], ["mpguk", "Miles Per Gallon Imperial (UK MPG)"]] }
    ],
    note: "Converts automotive fuel consumption across US, metric, and UK standards.",
    compute(v) {
      const val = num(v.value, "Fuel Economy", { min: 0.1 });
      let mpgUs = val;
      if (v.fromUnit === "l100km") mpgUs = 235.214583 / val;
      else if (v.fromUnit === "kml") mpgUs = val * 2.35214583;
      else if (v.fromUnit === "mpguk") mpgUs = val / 1.20095;
      const l100 = 235.214583 / mpgUs;
      const kml = mpgUs / 2.35214583;
      const mpgUk = mpgUs * 1.20095;
      return {
        results: [
          { label: "Miles Per Gallon (US MPG)", value: `${mpgUs.toFixed(2)} MPG`, primary: true },
          { label: "Liters per 100 km", value: `${l100.toFixed(2)} L/100km` },
          { label: "Kilometers per Liter", value: `${kml.toFixed(2)} km/L` },
          { label: "Miles Per Gallon (UK Imperial)", value: `${mpgUk.toFixed(2)} MPG (UK)` }
        ]
      };
    }
  },

  "network-transfer-rate-converter": {
    fields: [
      { id: "value", label: "Transfer Speed", type: "number", default: "100" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "mbps", choices: [["mbps", "Megabits per sec (Mbps)"], ["mbs", "Megabytes per sec (MB/s)"], ["gbps", "Gigabits per sec (Gbps)"], ["kbps", "Kilobits per sec (Kbps)"]] }
    ],
    note: "Converts network bandwidth and file transfer speed (1 Byte = 8 bits).",
    compute(v) {
      const val = num(v.value, "Speed", { min: 0 });
      let mbps = val;
      if (v.fromUnit === "mbs") mbps = val * 8;
      else if (v.fromUnit === "gbps") mbps = val * 1000;
      else if (v.fromUnit === "kbps") mbps = val / 1000;
      const mbs = mbps / 8;
      const gbps = mbps / 1000;
      const tbPerHour = (mbs * 3600) / 1e6;
      return {
        results: [
          { label: "Megabits / sec (Mbps)", value: `${mbps.toFixed(2)} Mbps`, primary: true },
          { label: "Megabytes / sec (MB/s)", value: `${mbs.toFixed(2)} MB/s` },
          { label: "Gigabits / sec (Gbps)", value: `${gbps.toFixed(3)} Gbps` },
          { label: "Hourly Transfer Volume", value: `${(mbs * 3.6).toFixed(2)} GB/hour (${tbPerHour.toFixed(3)} TB/h)` }
        ]
      };
    }
  },

  "force-units-converter": {
    fields: [
      { id: "value", label: "Force Value", type: "number", default: "500" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "n", choices: [["n", "Newtons (N)"], ["lbf", "Pound-force (lbf)"], ["kn", "Kilonewtons (kN)"], ["dynes", "Dynes (dyn)"], ["kgf", "Kilogram-force (kgf)"]] }
    ],
    note: "Converts between SI and imperial force measurements.",
    compute(v) {
      const val = num(v.value, "Force");
      let n = val;
      if (v.fromUnit === "lbf") n = val * 4.4482216;
      else if (v.fromUnit === "kn") n = val * 1000;
      else if (v.fromUnit === "dynes") n = val * 1e-5;
      else if (v.fromUnit === "kgf") n = val * 9.80665;
      return {
        results: [
          { label: "Newtons (N)", value: `${n.toFixed(2)} N`, primary: true },
          { label: "Pound-force (lbf)", value: `${(n * 0.224809).toFixed(2)} lbf` },
          { label: "Kilonewtons (kN)", value: `${(n / 1000).toFixed(4)} kN` },
          { label: "Kilogram-force (kgf)", value: `${(n / 9.80665).toFixed(2)} kgf` }
        ]
      };
    }
  },

  "pressure-units-converter": {
    fields: [
      { id: "value", label: "Pressure Value", type: "number", default: "32" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "psi", choices: [["psi", "PSI (Pounds per Square Inch)"], ["bar", "Bar"], ["kpa", "Kilopascals (kPa)"], ["atm", "Atmospheres (atm)"], ["torr", "Torr / mmHg"]] }
    ],
    note: "Converts between industrial, weather, and laboratory pressure units.",
    compute(v) {
      const val = num(v.value, "Pressure");
      let pa = val * 6894.757; // PSI to Pa
      if (v.fromUnit === "bar") pa = val * 100000;
      else if (v.fromUnit === "kpa") pa = val * 1000;
      else if (v.fromUnit === "atm") pa = val * 101325;
      else if (v.fromUnit === "torr") pa = val * 133.322;
      return {
        results: [
          { label: "PSI", value: `${(pa / 6894.757).toFixed(2)} PSI`, primary: true },
          { label: "Bar", value: `${(pa / 100000).toFixed(3)} bar` },
          { label: "Kilopascals (kPa)", value: `${(pa / 1000).toFixed(2)} kPa` },
          { label: "Atmospheres (atm)", value: `${(pa / 101325).toFixed(3)} atm` },
          { label: "Torr (mmHg)", value: `${(pa / 133.322).toFixed(1)} Torr` }
        ]
      };
    }
  },

  "energy-units-converter": {
    fields: [
      { id: "value", label: "Energy Value", type: "number", default: "1000" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "j", choices: [["j", "Joules (J)"], ["cal", "Calories (cal)"], ["kcal", "Kilocalories (Food kcal)"], ["kwh", "Kilowatt-hours (kWh)"], ["btu", "BTU (British Thermal Units)"], ["ftlbf", "Foot-pounds (ft·lbf)"]] }
    ],
    note: "Converts thermal, mechanical, and electrical energy units.",
    compute(v) {
      const val = num(v.value, "Energy");
      let joules = val;
      if (v.fromUnit === "cal") joules = val * 4.184;
      else if (v.fromUnit === "kcal") joules = val * 4184;
      else if (v.fromUnit === "kwh") joules = val * 3.6e6;
      else if (v.fromUnit === "btu") joules = val * 1055.056;
      else if (v.fromUnit === "ftlbf") joules = val * 1.355818;
      return {
        results: [
          { label: "Joules (J)", value: `${joules.toLocaleString("en-US", { maximumFractionDigits: 1 })} J`, primary: true },
          { label: "Kilocalories (Food Calories)", value: `${(joules / 4184).toFixed(2)} kcal` },
          { label: "Kilowatt-hours (kWh)", value: `${(joules / 3.6e6).toFixed(5)} kWh` },
          { label: "BTU", value: `${(joules / 1055.056).toFixed(2)} BTU` },
          { label: "Foot-pounds", value: `${(joules / 1.355818).toFixed(1)} ft·lbf` }
        ]
      };
    }
  },

  "power-units-converter": {
    fields: [
      { id: "value", label: "Power Value", type: "number", default: "10" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "kw", choices: [["kw", "Kilowatts (kW)"], ["hp", "Horsepower Mechanical (HP)"], ["w", "Watts (W)"], ["btuh", "BTU per hour (BTU/hr)"], ["ton", "Tons of Refrigeration (TR)"]] }
    ],
    note: "Converts electrical, mechanical, and HVAC thermal power units.",
    compute(v) {
      const val = num(v.value, "Power");
      let watts = val * 1000;
      if (v.fromUnit === "hp") watts = val * 745.69987;
      else if (v.fromUnit === "w") watts = val;
      else if (v.fromUnit === "btuh") watts = val * 0.293071;
      else if (v.fromUnit === "ton") watts = val * 3516.853;
      return {
        results: [
          { label: "Kilowatts (kW)", value: `${(watts / 1000).toFixed(3)} kW`, primary: true },
          { label: "Horsepower (HP)", value: `${(watts / 745.69987).toFixed(2)} HP` },
          { label: "Watts (W)", value: `${watts.toFixed(1)} W` },
          { label: "BTU/hour", value: `${(watts / 0.293071).toFixed(0)} BTU/hr` }
        ]
      };
    }
  },

  "angle-units-converter": {
    fields: [
      { id: "value", label: "Angle Value", type: "number", default: "180" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "deg", choices: [["deg", "Degrees (°)"], ["rad", "Radians (rad)"], ["grad", "Gradians (grad)"], ["mils", "NATO Mils (mil)"]] }
    ],
    note: "Converts geometric and ballistic angles.",
    compute(v) {
      const val = num(v.value, "Angle");
      let deg = val;
      if (v.fromUnit === "rad") deg = val * (180 / Math.PI);
      else if (v.fromUnit === "grad") deg = val * 0.9;
      else if (v.fromUnit === "mils") deg = val * (360 / 6400);
      const rad = deg * (Math.PI / 180);
      return {
        results: [
          { label: "Degrees (°)", value: `${deg.toFixed(4)}°`, primary: true },
          { label: "Radians (rad)", value: `${rad.toFixed(4)} rad (${(rad / Math.PI).toFixed(3)}π)` },
          { label: "Gradians (gon)", value: `${(deg / 0.9).toFixed(2)} grad` },
          { label: "NATO Mils", value: `${Math.round(deg * (6400 / 360))} mils` }
        ]
      };
    }
  },

  "flow-rate-units-converter": {
    fields: [
      { id: "value", label: "Flow Rate Value", type: "number", default: "15" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "gpm", choices: [["gpm", "Gallons per minute (GPM)"], ["lmin", "Liters per minute (L/min)"], ["m3h", "Cubic meters / hour (m³/h)"], ["cfm", "Cubic feet / minute (CFM)"]] }
    ],
    note: "Converts liquid and ventilation gas flow rates.",
    compute(v) {
      const val = num(v.value, "Flow Rate", { min: 0 });
      let gpm = val;
      if (v.fromUnit === "lmin") gpm = val * 0.264172;
      else if (v.fromUnit === "m3h") gpm = val * 4.402868;
      else if (v.fromUnit === "cfm") gpm = val * 7.48052;
      const lmin = gpm * 3.78541;
      const m3h = gpm * 0.227125;
      const cfm = gpm / 7.48052;
      return {
        results: [
          { label: "Gallons per Minute (GPM)", value: `${gpm.toFixed(2)} GPM`, primary: true },
          { label: "Liters per Minute (L/min)", value: `${lmin.toFixed(2)} L/min` },
          { label: "Cubic Meters / Hour (m³/h)", value: `${m3h.toFixed(3)} m³/h` },
          { label: "Cubic Feet / Minute (CFM)", value: `${cfm.toFixed(2)} CFM` }
        ]
      };
    }
  },

  "radiation-dose-converter": {
    fields: [
      { id: "value", label: "Dose Value", type: "number", default: "1.0" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "msv", choices: [["msv", "Millisieverts (mSv)"], ["rem", "Rem"], ["mrem", "Millirem (mrem)"], ["sv", "Sieverts (Sv)"]] }
    ],
    note: "Converts radiation biological equivalent dose units.",
    compute(v) {
      const val = num(v.value, "Radiation Dose", { min: 0 });
      let msv = val;
      if (v.fromUnit === "rem") msv = val * 10;
      else if (v.fromUnit === "mrem") msv = val * 0.01;
      else if (v.fromUnit === "sv") msv = val * 1000;
      return {
        results: [
          { label: "Millisieverts (mSv)", value: `${msv.toFixed(3)} mSv`, primary: true },
          { label: "Millirem (mrem)", value: `${(msv * 100).toFixed(1)} mrem` },
          { label: "Sieverts (Sv)", value: `${(msv / 1000).toFixed(6)} Sv` },
          { label: "Rem", value: `${(msv / 10).toFixed(4)} rem` }
        ]
      };
    }
  },

  "rotational-speed-frequency-converter": {
    fields: [
      { id: "value", label: "Rotational Speed Value", type: "number", default: "3000" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "rpm", choices: [["rpm", "RPM (Revolutions Per Minute)"], ["hz", "Hertz (Hz = Rev/sec)"], ["rads", "Radians per second (rad/s)"]] }
    ],
    note: "Converts rotational motor speed and frequency.",
    compute(v) {
      const val = num(v.value, "Speed", { min: 0 });
      let rpm = val;
      if (v.fromUnit === "hz") rpm = val * 60;
      else if (v.fromUnit === "rads") rpm = val * (60 / (2 * Math.PI));
      const hz = rpm / 60;
      const rads = (rpm * 2 * Math.PI) / 60;
      return {
        results: [
          { label: "Revolutions Per Minute (RPM)", value: `${rpm.toFixed(1)} RPM`, primary: true },
          { label: "Frequency (Hz)", value: `${hz.toFixed(2)} Hz` },
          { label: "Angular Velocity (rad/s)", value: `${rads.toFixed(2)} rad/s` }
        ]
      };
    }
  },

  "international-shoe-size-converter": {
    fields: [
      { id: "usMenSize", label: "US Men Shoe Size", type: "number", default: "10.5", step: "0.5" }
    ],
    note: "Converts US Men shoe sizes to US Women, UK, European (EU), and centimeters.",
    compute(v) {
      const usM = num(v.usMenSize, "US Men Size", { min: 4, max: 18 });
      const usW = usM + 1.5;
      const uk = usM - 0.5;
      const eu = Math.round((usM * 1.27) + 31.5);
      const cm = (usM * 0.846) + 19.5;
      return {
        results: [
          { label: "European Size (EU)", value: `EU ${eu}`, primary: true },
          { label: "UK Size", value: `UK ${uk.toFixed(1)}` },
          { label: "US Women Size", value: `US Women ${usW.toFixed(1)}` },
          { label: "Foot Length Approx", value: `~${cm.toFixed(1)} cm (${(cm / 2.54).toFixed(1)} inches)` }
        ]
      };
    }
  },

  "ring-size-converter": {
    fields: [
      { id: "usRingSize", label: "US / Canada Ring Size", type: "number", default: "7", step: "0.5" }
    ],
    note: "Converts US ring sizes to inside diameter (mm), circumference, and UK/EU standards.",
    compute(v) {
      const us = num(v.usRingSize, "Ring Size", { min: 3, max: 16 });
      const diameterMm = 11.63 + (us * 0.8128);
      const circumferenceMm = diameterMm * Math.PI;
      // Approximate UK letter mapping
      const ukIndex = Math.round((us - 3) * 2);
      const letters = ["F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","Z+1"];
      const ukLetter = letters[Math.min(letters.length - 1, Math.max(0, ukIndex))] || "N";
      return {
        results: [
          { label: "Inside Diameter (mm)", value: `${diameterMm.toFixed(2)} mm`, primary: true },
          { label: "Inside Circumference (mm)", value: `${circumferenceMm.toFixed(1)} mm`, primary: false },
          { label: "UK / Australia Letter Size", value: `Size ${ukLetter}` },
          { label: "EU / ISO Size (Circumference)", value: `EU ${Math.round(circumferenceMm)}` }
        ]
      };
    }
  },

  "cooking-volume-converter": {
    fields: [
      { id: "value", label: "Amount", type: "number", default: "1.0" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "cup", choices: [["cup", "US Cups"], ["tbsp", "Tablespoons (tbsp)"], ["tsp", "Teaspoons (tsp)"], ["floz", "Fluid Ounces (fl oz)"], ["ml", "Milliliters (ml)"], ["pint", "Pints (pt)"], ["quart", "Quarts (qt)"]] }
    ],
    note: "Converts kitchen culinary recipe measurements.",
    compute(v) {
      const val = num(v.value, "Amount", { min: 0 });
      let ml = val * 236.588; // cup to ml
      if (v.fromUnit === "tbsp") ml = val * 14.787;
      else if (v.fromUnit === "tsp") ml = val * 4.929;
      else if (v.fromUnit === "floz") ml = val * 29.5735;
      else if (v.fromUnit === "ml") ml = val;
      else if (v.fromUnit === "pint") ml = val * 473.176;
      else if (v.fromUnit === "quart") ml = val * 946.353;
      return {
        results: [
          { label: "Cups", value: `${(ml / 236.588).toFixed(2)} cups`, primary: true },
          { label: "Tablespoons (tbsp)", value: `${(ml / 14.787).toFixed(1)} tbsp` },
          { label: "Teaspoons (tsp)", value: `${(ml / 4.929).toFixed(1)} tsp` },
          { label: "Fluid Ounces (fl oz)", value: `${(ml / 29.5735).toFixed(2)} fl oz` },
          { label: "Milliliters (ml)", value: `${ml.toFixed(1)} ml` }
        ]
      };
    }
  },

  "wire-gauge-awg-converter": {
    fields: [
      { id: "awgGauge", label: "American Wire Gauge (AWG) (e.g. 10, 12, 14, 18, 24)", type: "number", default: "12" }
    ],
    note: "Calculates copper wire diameter in millimeters/inches and maximum chassis ampacity.",
    compute(v) {
      const awg = num(v.awgGauge, "AWG", { min: 0, max: 40 });
      const diameterMm = 0.127 * Math.pow(92, (36 - awg) / 39);
      const diameterInches = diameterMm / 25.4;
      const areaMm2 = (Math.PI / 4) * (diameterMm * diameterMm);
      // Rough ampacity rule of thumb for chassis wiring
      const ampacity = Math.round(areaMm2 * 9.5);
      return {
        results: [
          { label: "Wire Diameter (mm)", value: `${diameterMm.toFixed(3)} mm`, primary: true },
          { label: "Wire Diameter (Inches)", value: `${diameterInches.toFixed(4)} in` },
          { label: "Cross-Section Area", value: `${areaMm2.toFixed(3)} mm²` },
          { label: "Estimated Power Ampacity", value: `~${ampacity} Amps` }
        ],
        formula: "d = 0.127 × 92^[(36 - AWG)/39] mm"
      };
    }
  },

  "temperature-interval-converter": {
    fields: [
      { id: "deltaValue", label: "Temperature Difference (ΔT)", type: "number", default: "10" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "c", choices: [["c", "Delta Celsius (Δ°C)"], ["f", "Delta Fahrenheit (Δ°F)"], ["k", "Delta Kelvin (ΔK)"]] }
    ],
    note: "Converts temperature changes / intervals (notice: Δ1°C = Δ1.8°F, no 32-degree offset).",
    compute(v) {
      const val = num(v.deltaValue, "Delta T");
      let deltaC = val;
      if (v.fromUnit === "f") deltaC = val / 1.8;
      else if (v.fromUnit === "k") deltaC = val;
      const deltaF = deltaC * 1.8;
      return {
        results: [
          { label: "Delta Celsius (Δ°C)", value: `Δ ${deltaC.toFixed(2)} °C`, primary: true },
          { label: "Delta Fahrenheit (Δ°F)", value: `Δ ${deltaF.toFixed(2)} °F` },
          { label: "Delta Kelvin (ΔK)", value: `Δ ${deltaC.toFixed(2)} K` }
        ],
        formula: "Δ°F = 1.8 × Δ°C | ΔK = Δ°C"
      };
    }
  },

  "density-units-converter": {
    fields: [
      { id: "value", label: "Density Value", type: "number", default: "1.0" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "gcm3", choices: [["gcm3", "Grams per cubic cm (g/cm³)"], ["kgm3", "Kilograms per cubic meter (kg/m³)"], ["lbft3", "Pounds per cubic foot (lb/ft³)"], ["lbin3", "Pounds per cubic inch (lb/in³)"]] }
    ],
    note: "Converts material densities across metric and US customary units.",
    compute(v) {
      const val = num(v.value, "Density", { min: 0 });
      let kgm3 = val * 1000; // g/cm³ to kg/m³
      if (v.fromUnit === "kgm3") kgm3 = val;
      else if (v.fromUnit === "lbft3") kgm3 = val * 16.018463;
      else if (v.fromUnit === "lbin3") kgm3 = val * 27679.904;
      return {
        results: [
          { label: "Kilograms / m³ (kg/m³)", value: `${kgm3.toFixed(1)} kg/m³`, primary: true },
          { label: "Grams / cm³ (g/cm³)", value: `${(kgm3 / 1000).toFixed(4)} g/cm³` },
          { label: "Pounds / ft³ (lb/ft³)", value: `${(kgm3 / 16.018463).toFixed(2)} lb/ft³` },
          { label: "Pounds / in³ (lb/in³)", value: `${(kgm3 / 27679.904).toFixed(5)} lb/in³` }
        ]
      };
    }
  },

  "data-storage-units-converter": {
    fields: [
      { id: "value", label: "Storage Size", type: "number", default: "512" },
      { id: "fromUnit", label: "From Unit", type: "select", default: "gb", choices: [["gb", "Gigabytes (GB 10^9)"], ["gib", "Gibibytes (GiB 2^30)"], ["tb", "Terabytes (TB 10^12)"], ["mb", "Megabytes (MB 10^6)"]] }
    ],
    note: "Compares Decimal (1000x base) drive manufacturer sizes against Binary (1024x base) OS reported sizes.",
    compute(v) {
      const val = num(v.value, "Storage", { min: 0 });
      let bytes = val * 1e9;
      if (v.fromUnit === "gib") bytes = val * Math.pow(1024, 3);
      else if (v.fromUnit === "tb") bytes = val * 1e12;
      else if (v.fromUnit === "mb") bytes = val * 1e6;
      const gbDecimal = bytes / 1e9;
      const gibBinary = bytes / Math.pow(1024, 3);
      const tbDecimal = bytes / 1e12;
      const tibBinary = bytes / Math.pow(1024, 4);
      return {
        results: [
          { label: "Operating System Binary (GiB)", value: `${gibBinary.toFixed(2)} GiB`, primary: true },
          { label: "Manufacturer Decimal (GB)", value: `${gbDecimal.toFixed(2)} GB` },
          { label: "Terabytes (TB)", value: `${tbDecimal.toFixed(3)} TB (${tibBinary.toFixed(3)} TiB)` },
          { label: "Exact Bytes", value: `${Math.round(bytes).toLocaleString()} Bytes` }
        ]
      };
    }
  }
};
