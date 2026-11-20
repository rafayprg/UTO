import type { CalcOp } from "./types";

function num(value: string, label: string, { min = -Infinity, max = Infinity, allowZero = true } = {}): number {
  const parsed = Number(String(value).replace(/,/g, "").trim());
  if (value.trim() === "" || !Number.isFinite(parsed)) throw new Error(`Enter a number for ${label}.`);
  if (parsed < min || parsed > max || (!allowZero && parsed === 0)) throw new Error(`${label} must be ${allowZero ? "at least" : "greater than"} ${min}.`);
  return parsed;
}

export const physicsOps: Record<string, CalcOp> = {
  "ohms-law-calculator": {
    fields: [
      { id: "voltage", label: "Voltage (V in Volts)", type: "number", default: "12" },
      { id: "current", label: "Current (I in Amperes)", type: "number", default: "2" }
    ],
    note: "Calculates electrical resistance (Ohms) and dissipated power (Watts) using Ohm's Law.",
    compute(v) {
      const volt = num(v.voltage, "Voltage");
      const curr = num(v.current, "Current", { min: 0.00000001, allowZero: false });
      const resistance = volt / curr;
      const power = volt * curr;
      return {
        results: [
          { label: "Resistance (R)", value: `${resistance.toFixed(3)} Ω (Ohms)`, primary: true },
          { label: "Power Dissipation (P)", value: `${power.toFixed(3)} W (Watts)` },
          { label: "Conductance (G)", value: `${(1 / resistance).toFixed(4)} S (Siemens)` }
        ],
        formula: "R = V / I | P = V × I"
      };
    }
  },

  "kinetic-energy-calculator": {
    fields: [
      { id: "mass", label: "Mass (m in kg)", type: "number", default: "75" },
      { id: "velocity", label: "Velocity (v in m/s)", type: "number", default: "20" }
    ],
    note: "Calculates the kinetic energy of an object in motion.",
    compute(v) {
      const m = num(v.mass, "Mass", { min: 0 });
      const vel = num(v.velocity, "Velocity");
      const ke = 0.5 * m * (vel * vel);
      const joules = ke;
      const calories = ke / 4.184;
      return {
        results: [
          { label: "Kinetic Energy (KE)", value: `${joules.toLocaleString("en-US", { maximumFractionDigits: 2 })} J (Joules)`, primary: true },
          { label: "Kilojoules (kJ)", value: `${(joules / 1000).toFixed(3)} kJ` },
          { label: "Calories", value: `${calories.toFixed(2)} cal` },
          { label: "Foot-Pounds (ft·lbf)", value: `${(joules * 0.737562).toFixed(2)} ft·lbf` }
        ],
        formula: "KE = ½ m v²"
      };
    }
  },

  "potential-energy-calculator": {
    fields: [
      { id: "mass", label: "Mass (m in kg)", type: "number", default: "50" },
      { id: "height", label: "Height (h in meters)", type: "number", default: "15" },
      { id: "gravity", label: "Gravitational Acceleration (g in m/s²)", type: "number", default: "9.80665" }
    ],
    note: "Calculates gravitational potential energy stored in an elevated object.",
    compute(v) {
      const m = num(v.mass, "Mass", { min: 0 });
      const h = num(v.height, "Height", { min: 0 });
      const g = num(v.gravity, "Gravity", { min: 0 });
      const pe = m * g * h;
      return {
        results: [
          { label: "Potential Energy (PE)", value: `${pe.toLocaleString("en-US", { maximumFractionDigits: 2 })} J`, primary: true },
          { label: "Kilojoules (kJ)", value: `${(pe / 1000).toFixed(3)} kJ` }
        ],
        formula: "PE = m g h"
      };
    }
  },

  "newton-second-law-calculator": {
    fields: [
      { id: "mass", label: "Mass (m in kg)", type: "number", default: "1200" },
      { id: "acceleration", label: "Acceleration (a in m/s²)", type: "number", default: "3.5" }
    ],
    note: "Newton's second law of motion: Net Force = Mass × Acceleration.",
    compute(v) {
      const m = num(v.mass, "Mass", { min: 0 });
      const a = num(v.acceleration, "Acceleration");
      const f = m * a;
      return {
        results: [
          { label: "Net Force (F)", value: `${f.toLocaleString("en-US", { maximumFractionDigits: 2 })} N (Newtons)`, primary: true },
          { label: "Pound-force (lbf)", value: `${(f * 0.224809).toFixed(2)} lbf` },
          { label: "Kilonewtons (kN)", value: `${(f / 1000).toFixed(3)} kN` }
        ],
        formula: "F = m × a"
      };
    }
  },

  "kinematics-motion-calculator": {
    fields: [
      { id: "initialVelocity", label: "Initial Velocity (v₀ in m/s)", type: "number", default: "0" },
      { id: "acceleration", label: "Acceleration (a in m/s²)", type: "number", default: "9.8" },
      { id: "time", label: "Elapsed Time (t in seconds)", type: "number", default: "5" }
    ],
    note: "Calculates final velocity and total displacement under constant acceleration.",
    compute(v) {
      const v0 = num(v.initialVelocity, "Initial Velocity");
      const a = num(v.acceleration, "Acceleration");
      const t = num(v.time, "Time", { min: 0 });
      const finalVel = v0 + (a * t);
      const displacement = (v0 * t) + (0.5 * a * (t * t));
      return {
        results: [
          { label: "Final Velocity (v)", value: `${finalVel.toFixed(2)} m/s (${(finalVel * 3.6).toFixed(1)} km/h)`, primary: true },
          { label: "Displacement (d)", value: `${displacement.toFixed(2)} m (${(displacement * 3.28084).toFixed(1)} ft)` },
          { label: "Average Velocity", value: `${((v0 + finalVel) / 2).toFixed(2)} m/s` }
        ],
        formula: "v = v₀ + at | d = v₀t + ½at²"
      };
    }
  },

  "density-mass-volume-calculator": {
    fields: [
      { id: "mass", label: "Mass (kg)", type: "number", default: "15" },
      { id: "volume", label: "Volume (m³)", type: "number", default: "0.005" }
    ],
    note: "Calculates density and compares against standard water reference.",
    compute(v) {
      const m = num(v.mass, "Mass", { min: 0 });
      const vol = num(v.volume, "Volume", { min: 0.000000001, allowZero: false });
      const density = m / vol;
      const gcm3 = density / 1000;
      return {
        results: [
          { label: "Density (ρ)", value: `${density.toFixed(2)} kg/m³ (${gcm3.toFixed(3)} g/cm³)`, primary: true },
          { label: "Specific Gravity (vs Water)", value: `${(density / 1000).toFixed(3)}` },
          { label: "Buoyancy in Water", value: density < 1000 ? "Floats (ρ < 1000 kg/m³)" : "Sinks (ρ ≥ 1000 kg/m³)" }
        ],
        formula: "ρ = m / V"
      };
    }
  },

  "pressure-force-area-calculator": {
    fields: [
      { id: "force", label: "Total Force (N in Newtons)", type: "number", default: "5000" },
      { id: "area", label: "Surface Contact Area (m²)", type: "number", default: "0.25" }
    ],
    note: "Calculates pressure in Pascals, PSI, Bar, and atmospheres.",
    compute(v) {
      const f = num(v.force, "Force", { min: 0 });
      const a = num(v.area, "Area", { min: 0.00000001, allowZero: false });
      const pa = f / a;
      return {
        results: [
          { label: "Pressure (P)", value: `${pa.toLocaleString("en-US", { maximumFractionDigits: 1 })} Pa (Pascals)`, primary: true },
          { label: "Kilopascals (kPa)", value: `${(pa / 1000).toFixed(2)} kPa` },
          { label: "Pounds per Sq Inch (PSI)", value: `${(pa * 0.000145038).toFixed(2)} PSI` },
          { label: "Bar", value: `${(pa / 100000).toFixed(4)} bar` },
          { label: "Standard Atmospheres (atm)", value: `${(pa / 101325).toFixed(4)} atm` }
        ],
        formula: "P = F / A"
      };
    }
  },

  "torque-calculator": {
    fields: [
      { id: "force", label: "Applied Force (F in Newtons)", type: "number", default: "150" },
      { id: "radius", label: "Lever Arm Length / Radius (r in meters)", type: "number", default: "0.4" },
      { id: "angle", label: "Angle of Force (θ in degrees)", type: "number", default: "90" }
    ],
    note: "Calculates rotational torque and foot-pounds.",
    compute(v) {
      const f = num(v.force, "Force", { min: 0 });
      const r = num(v.radius, "Radius", { min: 0 });
      const theta = num(v.angle, "Angle", { min: 0, max: 360 }) * (Math.PI / 180);
      const torque = r * f * Math.sin(theta);
      return {
        results: [
          { label: "Torque (τ)", value: `${torque.toFixed(2)} N·m (Newton-meters)`, primary: true },
          { label: "Pound-Feet (lbf·ft)", value: `${(torque * 0.737562).toFixed(2)} lbf·ft` },
          { label: "Inch-Pounds (lbf·in)", value: `${(torque * 8.85075).toFixed(1)} lbf·in` }
        ],
        formula: "τ = r × F × sin(θ)"
      };
    }
  },

  "momentum-calculator": {
    fields: [
      { id: "mass", label: "Object Mass (m in kg)", type: "number", default: "1200" },
      { id: "velocity", label: "Object Velocity (v in m/s)", type: "number", default: "25" }
    ],
    note: "Calculates linear momentum p = mv.",
    compute(v) {
      const m = num(v.mass, "Mass", { min: 0 });
      const vel = num(v.velocity, "Velocity");
      const p = m * vel;
      return {
        results: [
          { label: "Linear Momentum (p)", value: `${p.toLocaleString("en-US", { maximumFractionDigits: 1 })} kg·m/s (N·s)`, primary: true }
        ],
        formula: "p = m × v"
      };
    }
  },

  "ideal-gas-law-calculator": {
    fields: [
      { id: "pressure", label: "Pressure (P in kPa)", type: "number", default: "101.325" },
      { id: "volume", label: "Volume (V in Liters)", type: "number", default: "22.414" },
      { id: "temperature", label: "Temperature (T in Celsius °C)", type: "number", default: "0" }
    ],
    note: "Calculates amount of gas substance in moles using universal gas constant R = 8.314 J/(mol·K).",
    compute(v) {
      const p = num(v.pressure, "Pressure", { min: 0.001 }) * 1000; // kPa to Pa
      const vol = num(v.volume, "Volume", { min: 0.0001 }) / 1000; // Liters to m³
      const tempC = num(v.temperature, "Temperature");
      const tempK = tempC + 273.15;
      if (tempK <= 0) throw new Error("Temperature must be above absolute zero (-273.15 °C).");
      const R = 8.314462618;
      const moles = (p * vol) / (R * tempK);
      return {
        results: [
          { label: "Amount of Substance (n)", value: `${moles.toFixed(4)} moles`, primary: true },
          { label: "Temperature in Kelvin", value: `${tempK.toFixed(2)} K` },
          { label: "Number of Molecules", value: `${(moles * 6.02214076e23).toExponential(3)} molecules` }
        ],
        formula: "n = (P × V) / (R × T)"
      };
    }
  },

  "wave-speed-frequency-calculator": {
    fields: [
      { id: "frequency", label: "Wave Frequency (f in Hz)", type: "number", default: "440" },
      { id: "wavelength", label: "Wavelength (λ in meters)", type: "number", default: "0.78" }
    ],
    note: "Calculates wave propagation speed v = f × λ.",
    compute(v) {
      const f = num(v.frequency, "Frequency", { min: 0.00001 });
      const lambda = num(v.wavelength, "Wavelength", { min: 0.00001 });
      const speed = f * lambda;
      const period = 1 / f;
      return {
        results: [
          { label: "Wave Speed (v)", value: `${speed.toFixed(2)} m/s (${(speed * 3.6).toFixed(1)} km/h)`, primary: true },
          { label: "Wave Period (T)", value: `${(period * 1000).toFixed(3)} ms` }
        ],
        formula: "v = f × λ | T = 1 / f"
      };
    }
  },

  "hookes-law-spring-calculator": {
    fields: [
      { id: "springConstant", label: "Spring Constant (k in N/m)", type: "number", default: "250" },
      { id: "displacement", label: "Displacement / Extension (x in cm)", type: "number", default: "8" }
    ],
    note: "Calculates restoring spring force and stored elastic potential energy.",
    compute(v) {
      const k = num(v.springConstant, "Spring Constant", { min: 0 });
      const xMeters = num(v.displacement, "Displacement") / 100;
      const force = k * Math.abs(xMeters);
      const energy = 0.5 * k * (xMeters * xMeters);
      return {
        results: [
          { label: "Restoring Force (F)", value: `${force.toFixed(2)} N`, primary: true },
          { label: "Elastic Potential Energy (U)", value: `${energy.toFixed(3)} J` }
        ],
        formula: "F = k × x | U = ½ k x²"
      };
    }
  },

  "resistors-series-parallel-calculator": {
    fields: [
      { id: "r1", label: "Resistor 1 (R₁ in Ω)", type: "number", default: "100" },
      { id: "r2", label: "Resistor 2 (R₂ in Ω)", type: "number", default: "220" },
      { id: "r3", label: "Resistor 3 (Optional R₃ in Ω)", type: "number", default: "330" }
    ],
    note: "Calculates equivalent resistance for series and parallel electrical circuit connections.",
    compute(v) {
      const r1 = num(v.r1, "R1", { min: 0.01, allowZero: false });
      const r2 = num(v.r2, "R2", { min: 0.01, allowZero: false });
      const r3 = Number(v.r3) > 0 ? Number(v.r3) : 0;
      const series = r1 + r2 + r3;
      let parallelInv = (1 / r1) + (1 / r2);
      if (r3 > 0) parallelInv += (1 / r3);
      const parallel = 1 / parallelInv;
      return {
        results: [
          { label: "Series Equivalent (R_series)", value: `${series.toFixed(2)} Ω`, primary: true },
          { label: "Parallel Equivalent (R_parallel)", value: `${parallel.toFixed(2)} Ω` }
        ],
        formula: "R_s = R₁ + R₂ + R₃ | 1/R_p = 1/R₁ + 1/R₂ + 1/R₃"
      };
    }
  },

  "capacitors-series-parallel-calculator": {
    fields: [
      { id: "c1", label: "Capacitor 1 (C₁ in μF)", type: "number", default: "10" },
      { id: "c2", label: "Capacitor 2 (C₂ in μF)", type: "number", default: "22" }
    ],
    note: "Calculates equivalent capacitance in parallel (sum) and series (reciprocal sum).",
    compute(v) {
      const c1 = num(v.c1, "C1", { min: 0.0001, allowZero: false });
      const c2 = num(v.c2, "C2", { min: 0.0001, allowZero: false });
      const parallel = c1 + c2;
      const series = (c1 * c2) / (c1 + c2);
      return {
        results: [
          { label: "Parallel Capacitance (C_parallel)", value: `${parallel.toFixed(2)} μF`, primary: true },
          { label: "Series Capacitance (C_series)", value: `${series.toFixed(2)} μF` }
        ],
        formula: "C_p = C₁ + C₂ | 1/C_s = 1/C₁ + 1/C₂"
      };
    }
  },

  "capacitor-energy-charge-calculator": {
    fields: [
      { id: "capacitance", label: "Capacitance (C in μF)", type: "number", default: "100" },
      { id: "voltage", label: "Voltage (V in Volts)", type: "number", default: "25" }
    ],
    note: "Calculates stored electrical charge in Coulombs and energy in Joules.",
    compute(v) {
      const cFarads = num(v.capacitance, "Capacitance", { min: 0 }) / 1e6;
      const volt = num(v.voltage, "Voltage", { min: 0 });
      const q = cFarads * volt;
      const energy = 0.5 * cFarads * (volt * volt);
      return {
        results: [
          { label: "Stored Energy (E)", value: `${(energy * 1000).toFixed(3)} mJ (${energy.toFixed(6)} J)`, primary: true },
          { label: "Stored Charge (Q)", value: `${(q * 1000).toFixed(3)} mC (${q.toExponential(3)} C)` }
        ],
        formula: "E = ½ C V² | Q = C × V"
      };
    }
  },

  "decibel-ratio-calculator": {
    fields: [
      { id: "val2", label: "Output Value (P₂ or V₂)", type: "number", default: "100" },
      { id: "val1", label: "Reference Value (P₁ or V₁)", type: "number", default: "1" },
      { id: "type", label: "Quantity Type", type: "select", default: "power", choices: [["power", "Power Ratio (10 log10)"], ["voltage", "Voltage / Amplitude Ratio (20 log10)"]] }
    ],
    note: "Calculates decibel (dB) gain or attenuation for audio, acoustics, and RF signals.",
    compute(v) {
      const v2 = num(v.val2, "Output Value", { min: 0.00000001, allowZero: false });
      const v1 = num(v.val1, "Reference Value", { min: 0.00000001, allowZero: false });
      const factor = v.type === "voltage" ? 20 : 10;
      const db = factor * Math.log10(v2 / v1);
      return {
        results: [
          { label: "Decibels (dB)", value: `${db >= 0 ? "+" : ""}${db.toFixed(2)} dB`, primary: true },
          { label: "Linear Ratio", value: `${(v2 / v1).toFixed(2)}x` }
        ],
        formula: v.type === "voltage" ? "dB = 20 log₁₀(V₂ / V₁)" : "dB = 10 log₁₀(P₂ / P₁)"
      };
    }
  },

  "led-resistor-calculator": {
    fields: [
      { id: "supplyVoltage", label: "Power Supply Voltage (V_s in Volts)", type: "number", default: "5.0" },
      { id: "forwardVoltage", label: "LED Forward Voltage (V_f in Volts) (e.g. Red 2V, Blue 3.2V)", type: "number", default: "2.1" },
      { id: "targetCurrent", label: "Desired LED Forward Current (I_f in mA)", type: "number", default: "20" }
    ],
    note: "Calculates the exact current-limiting series resistor required to prevent burning out LEDs.",
    compute(v) {
      const vs = num(v.supplyVoltage, "Supply Voltage", { min: 0.1 });
      const vf = num(v.forwardVoltage, "Forward Voltage", { min: 0.1 });
      const ifMa = num(v.targetCurrent, "Current mA", { min: 0.1 });
      if (vf >= vs) throw new Error("Supply voltage must be greater than LED forward voltage.");
      const currentAmps = ifMa / 1000;
      const res = (vs - vf) / currentAmps;
      const powerWatts = (vs - vf) * currentAmps;
      return {
        results: [
          { label: "Calculated Resistor Value", value: `${res.toFixed(1)} Ω`, primary: true },
          { label: "Standard Nearest E24 Resistor", value: `~${Math.round(res)} Ω` },
          { label: "Resistor Power Dissipation", value: `${(powerWatts * 1000).toFixed(1)} mW (Use at least 0.25W resistor)` }
        ],
        formula: "R = (V_supply - V_forward) / I_forward"
      };
    }
  },

  "centripetal-force-calculator": {
    fields: [
      { id: "mass", label: "Rotating Body Mass (m in kg)", type: "number", default: "850" },
      { id: "velocity", label: "Tangential Velocity (v in m/s)", type: "number", default: "15" },
      { id: "radius", label: "Curve Radius (r in meters)", type: "number", default: "45" }
    ],
    note: "Calculates centripetal acceleration and required inward cornering force.",
    compute(v) {
      const m = num(v.mass, "Mass", { min: 0 });
      const vel = num(v.velocity, "Velocity");
      const r = num(v.radius, "Radius", { min: 0.001, allowZero: false });
      const ac = (vel * vel) / r;
      const fc = m * ac;
      return {
        results: [
          { label: "Centripetal Force (F_c)", value: `${fc.toLocaleString("en-US", { maximumFractionDigits: 1 })} N`, primary: true },
          { label: "Centripetal Acceleration (a_c)", value: `${ac.toFixed(2)} m/s² (${(ac / 9.80665).toFixed(2)} G's)` }
        ],
        formula: "a_c = v² / r | F_c = m × v² / r"
      };
    }
  },

  "thermal-heat-transfer-calculator": {
    fields: [
      { id: "mass", label: "Mass of Substance (m in kg)", type: "number", default: "2.5" },
      { id: "specificHeat", label: "Specific Heat Capacity (c in J/(kg·K)) (Water = 4184)", type: "number", default: "4184" },
      { id: "tempDelta", label: "Temperature Change (ΔT in °C or K)", type: "number", default: "40" }
    ],
    note: "Calculates heat energy added or released during temperature change Q = mcΔT.",
    compute(v) {
      const m = num(v.mass, "Mass", { min: 0 });
      const c = num(v.specificHeat, "Specific Heat", { min: 1 });
      const deltaT = num(v.tempDelta, "Delta T");
      const q = m * c * deltaT;
      return {
        results: [
          { label: "Thermal Energy (Q)", value: `${q.toLocaleString("en-US", { maximumFractionDigits: 1 })} J`, primary: true },
          { label: "Kilojoules (kJ)", value: `${(q / 1000).toFixed(2)} kJ` },
          { label: "Kilocalories (kcal)", value: `${(q / 4184).toFixed(2)} kcal` },
          { label: "BTU", value: `${(q * 0.000947817).toFixed(2)} BTU` }
        ],
        formula: "Q = m × c × ΔT"
      };
    }
  },

  "rc-time-constant-calculator": {
    fields: [
      { id: "resistance", label: "Resistance (R in kΩ)", type: "number", default: "47" },
      { id: "capacitance", label: "Capacitance (C in μF)", type: "number", default: "10" }
    ],
    note: "Calculates the RC charging time constant τ and time to reach 99.3% charge (5τ).",
    compute(v) {
      const r = num(v.resistance, "Resistance", { min: 0 }) * 1000;
      const c = num(v.capacitance, "Capacitance", { min: 0 }) / 1e6;
      const tau = r * c;
      return {
        results: [
          { label: "Time Constant (τ = RC)", value: `${(tau * 1000).toFixed(2)} ms (${tau.toFixed(4)} s)`, primary: true },
          { label: "Time to 63.2% Charge (1τ)", value: `${(tau * 1000).toFixed(2)} ms` },
          { label: "Full Charge Time (5τ ≈ 99.3%)", value: `${(tau * 5 * 1000).toFixed(2)} ms` },
          { label: "Cutoff Frequency (-3dB)", value: `${(1 / (2 * Math.PI * tau)).toFixed(2)} Hz` }
        ],
        formula: "τ = R × C | f_c = 1 / (2πRC)"
      };
    }
  },

  "projectile-motion-calculator": {
    fields: [
      { id: "launchSpeed", label: "Initial Launch Velocity (v₀ in m/s)", type: "number", default: "25" },
      { id: "launchAngle", label: "Launch Angle (θ in degrees)", type: "number", default: "45" }
    ],
    note: "Calculates maximum trajectory height, flight hang time, and total horizontal range (vacuum trajectory).",
    compute(v) {
      const v0 = num(v.launchSpeed, "Launch Velocity", { min: 0 });
      const thetaDeg = num(v.launchAngle, "Angle", { min: 0, max: 90 });
      const theta = thetaDeg * (Math.PI / 180);
      const g = 9.80665;
      const v0x = v0 * Math.cos(theta);
      const v0y = v0 * Math.sin(theta);
      const hangTime = (2 * v0y) / g;
      const maxHeight = (v0y * v0y) / (2 * g);
      const maxRange = v0x * hangTime;
      return {
        results: [
          { label: "Maximum Range (R)", value: `${maxRange.toFixed(2)} m (${(maxRange * 3.28084).toFixed(1)} ft)`, primary: true },
          { label: "Maximum Peak Height (H)", value: `${maxHeight.toFixed(2)} m` },
          { label: "Total Flight Hang Time", value: `${hangTime.toFixed(2)} s` }
        ],
        formula: "R = (v₀² × sin(2θ)) / g | H = (v₀² × sin²(θ)) / (2g)"
      };
    }
  },

  "doppler-effect-calculator": {
    fields: [
      { id: "sourceFrequency", label: "Emitted Frequency (f₀ in Hz)", type: "number", default: "500" },
      { id: "speedOfSound", label: "Medium Sound Speed (v in m/s)", type: "number", default: "343" },
      { id: "sourceSpeed", label: "Source Velocity (v_s in m/s) (Positive = Approaching)", type: "number", default: "30" }
    ],
    note: "Calculates Doppler shifted observed acoustic or electromagnetic frequency.",
    compute(v) {
      const f0 = num(v.sourceFrequency, "Emitted Frequency", { min: 1 });
      const c = num(v.speedOfSound, "Speed of Sound", { min: 1 });
      const vs = num(v.sourceSpeed, "Source Speed");
      if (vs >= c) throw new Error("Source speed cannot exceed or equal speed of sound (sonic boom).");
      const observedApproaching = f0 * (c / (c - Math.abs(vs)));
      const observedReceding = f0 * (c / (c + Math.abs(vs)));
      return {
        results: [
          { label: "Approaching Observed Frequency", value: `${observedApproaching.toFixed(1)} Hz (+${(observedApproaching - f0).toFixed(1)} Hz)`, primary: true },
          { label: "Receding Observed Frequency", value: `${observedReceding.toFixed(1)} Hz (-${(f0 - observedReceding).toFixed(1)} Hz)` }
        ],
        formula: "f = f₀ × [v / (v ∓ v_s)]"
      };
    }
  },

  "escape-velocity-calculator": {
    fields: [
      { id: "bodyMass", label: "Celestial Body Mass (M in kg) (Earth = 5.972e24)", type: "number", default: "5.972e24" },
      { id: "bodyRadius", label: "Radius from Center (r in meters) (Earth = 6.371e6)", type: "number", default: "6.371e6" }
    ],
    note: "Calculates Newtonian escape velocity required to break free from gravitational orbit.",
    compute(v) {
      const m = num(v.bodyMass, "Mass", { min: 1 });
      const r = num(v.bodyRadius, "Radius", { min: 1 });
      const G = 6.67430e-11;
      const ve = Math.sqrt((2 * G * m) / r);
      return {
        results: [
          { label: "Escape Velocity (v_e)", value: `${(ve / 1000).toFixed(2)} km/s (${(ve * 2.23694).toFixed(0)} mph)`, primary: true },
          { label: "Meters per second", value: `${ve.toFixed(1)} m/s` }
        ],
        formula: "v_e = √[(2 × G × M) / r]"
      };
    }
  },

  "hydraulic-cylinder-force-calculator": {
    fields: [
      { id: "pressurePsi", label: "Hydraulic System Pressure (PSI)", type: "number", default: "2500" },
      { id: "boreDiameterInches", label: "Cylinder Bore Diameter (Inches)", type: "number", default: "3.5" }
    ],
    note: "Calculates hydraulic cylinder push force and tonnage output.",
    compute(v) {
      const psi = num(v.pressurePsi, "Pressure PSI", { min: 0 });
      const bore = num(v.boreDiameterInches, "Bore Diameter", { min: 0.1 });
      const radius = bore / 2;
      const areaSqIn = Math.PI * (radius * radius);
      const forceLbf = psi * areaSqIn;
      const tons = forceLbf / 2000;
      const forceKn = forceLbf * 0.00444822;
      return {
        results: [
          { label: "Hydraulic Push Force", value: `${tons.toFixed(2)} US Tons (${forceLbf.toLocaleString("en-US", { maximumFractionDigits: 0 })} lbf)`, primary: true },
          { label: "Force in Kilonewtons", value: `${forceKn.toFixed(1)} kN` },
          { label: "Piston Surface Area", value: `${areaSqIn.toFixed(2)} sq inches` }
        ],
        formula: "Force = Pressure × Area | Area = π × (Bore / 2)²"
      };
    }
  },

  "transformer-turns-ratio-calculator": {
    fields: [
      { id: "primaryVoltage", label: "Primary Voltage (V_p in Volts)", type: "number", default: "120" },
      { id: "secondaryVoltage", label: "Desired Secondary Voltage (V_s in Volts)", type: "number", default: "12" },
      { id: "primaryTurns", label: "Primary Winding Turns (N_p)", type: "number", default: "500" }
    ],
    note: "Calculates transformer turns ratio and required secondary winding coil turns.",
    compute(v) {
      const vp = num(v.primaryVoltage, "Primary Voltage", { min: 0.1 });
      const vs = num(v.secondaryVoltage, "Secondary Voltage", { min: 0.1 });
      const np = num(v.primaryTurns, "Primary Turns", { min: 1 });
      const ratio = vp / vs;
      const ns = np / ratio;
      return {
        results: [
          { label: "Turns Ratio (N_p : N_s)", value: `${ratio.toFixed(2)} : 1`, primary: true },
          { label: "Required Secondary Turns (N_s)", value: `${Math.round(ns)} turns` },
          { label: "Transformer Type", value: vs > vp ? "Step-Up Transformer" : "Step-Down Transformer" }
        ],
        formula: "V_p / V_s = N_p / N_s"
      };
    }
  },

  "pendulum-period-calculator": {
    fields: [
      { id: "length", label: "Pendulum Arm Length (L in meters)", type: "number", default: "1.0" },
      { id: "gravity", label: "Local Gravity (g in m/s²)", type: "number", default: "9.80665" }
    ],
    note: "Calculates the small-angle period and oscillation frequency of a simple gravity pendulum.",
    compute(v) {
      const l = num(v.length, "Length", { min: 0.001 });
      const g = num(v.gravity, "Gravity", { min: 0.001 });
      const t = 2 * Math.PI * Math.sqrt(l / g);
      const freq = 1 / t;
      return {
        results: [
          { label: "Oscillation Period (T)", value: `${t.toFixed(3)} seconds`, primary: true },
          { label: "Frequency (f)", value: `${freq.toFixed(3)} Hz` }
        ],
        formula: "T = 2π √(L / g)"
      };
    }
  },

  "speed-of-sound-air-calculator": {
    fields: [
      { id: "temperatureCelsius", label: "Air Temperature (T in °C)", type: "number", default: "20" }
    ],
    note: "Calculates acoustic sound velocity in dry air across temperatures.",
    compute(v) {
      const tc = num(v.temperatureCelsius, "Temperature");
      const speed = 331.3 * Math.sqrt(1 + (tc / 273.15));
      return {
        results: [
          { label: "Speed of Sound (c)", value: `${speed.toFixed(2)} m/s (${(speed * 3.6).toFixed(1)} km/h)`, primary: true },
          { label: "Speed in MPH", value: `${(speed * 2.23694).toFixed(1)} mph` },
          { label: "Speed in Mach 1.0", value: `${speed.toFixed(1)} m/s = Mach 1` }
        ],
        formula: "c ≈ 331.3 × √(1 + T_c / 273.15)"
      };
    }
  },

  "buoyancy-archimedes-calculator": {
    fields: [
      { id: "fluidDensity", label: "Fluid Density (ρ in kg/m³) (Water = 1000, Sea = 1025)", type: "number", default: "1000" },
      { id: "submergedVolume", label: "Submerged Object Volume (V in m³)", type: "number", default: "0.085" }
    ],
    note: "Archimedes' principle: Buoyant buoyant force equals the weight of displaced fluid.",
    compute(v) {
      const rho = num(v.fluidDensity, "Fluid Density", { min: 1 });
      const vol = num(v.submergedVolume, "Volume", { min: 0.000001 });
      const g = 9.80665;
      const fb = rho * vol * g;
      const displacedWeightKg = rho * vol;
      return {
        results: [
          { label: "Upward Buoyant Force (F_b)", value: `${fb.toFixed(1)} N (${(fb * 0.224809).toFixed(1)} lbf)`, primary: true },
          { label: "Displaced Fluid Mass", value: `${displacedWeightKg.toFixed(1)} kg (${(displacedWeightKg * 2.20462).toFixed(1)} lbs)` }
        ],
        formula: "F_b = ρ_fluid × V_displaced × g"
      };
    }
  },

  "apparent-power-factor-calculator": {
    fields: [
      { id: "realPower", label: "Real Active Power (P in kW)", type: "number", default: "45" },
      { id: "powerFactor", label: "Power Factor (cos θ) (Typical 0.70 - 0.95)", type: "number", default: "0.85", step: "0.01" }
    ],
    note: "Calculates AC electrical Apparent Power (kVA) and Reactive Power (kVAR).",
    compute(v) {
      const p = num(v.realPower, "Real Power", { min: 0 });
      const pf = num(v.powerFactor, "Power Factor", { min: 0.01, max: 1.0 });
      const s = p / pf;
      const q = Math.sqrt((s * s) - (p * p));
      return {
        results: [
          { label: "Apparent Power (S)", value: `${s.toFixed(2)} kVA`, primary: true },
          { label: "Reactive Power (Q)", value: `${q.toFixed(2)} kVAR` },
          { label: "Phase Angle (θ)", value: `${(Math.acos(pf) * (180 / Math.PI)).toFixed(1)}°` }
        ],
        formula: "S = P / cos(θ) | Q = √(S² - P²)"
      };
    }
  },

  "photon-energy-calculator": {
    fields: [
      { id: "wavelengthNm", label: "Light Wavelength (λ in nanometers nm)", type: "number", default: "550" }
    ],
    note: "Calculates single photon energy in electron-volts (eV) and Joules from electromagnetic wavelength.",
    compute(v) {
      const lambdaNm = num(v.wavelengthNm, "Wavelength", { min: 0.001 });
      const lambdaM = lambdaNm * 1e-9;
      const h = 6.62607015e-34; // Planck constant
      const c = 299792458; // speed of light
      const joules = (h * c) / lambdaM;
      const ev = joules / 1.602176634e-19;
      return {
        results: [
          { label: "Photon Energy", value: `${ev.toFixed(3)} eV (Electron-Volts)`, primary: true },
          { label: "Energy in Joules", value: `${joules.toExponential(3)} J` },
          { label: "Light Frequency", value: `${((c / lambdaM) / 1e12).toFixed(1)} THz` }
        ],
        formula: "E = (h × c) / λ"
      };
    }
  },

  "rl-circuit-time-constant": {
    fields: [
      { id: "inductanceMh", label: "Inductance (L in millihenries mH)", type: "number", default: "250" },
      { id: "resistanceOhms", label: "Resistance (R in Ohms Ω)", type: "number", default: "50" }
    ],
    note: "Calculates inductive RL circuit time constant τ = L/R.",
    compute(v) {
      const l = num(v.inductanceMh, "Inductance", { min: 0.001 }) / 1000;
      const r = num(v.resistanceOhms, "Resistance", { min: 0.001 });
      const tau = l / r;
      return {
        results: [
          { label: "RL Time Constant (τ = L/R)", value: `${(tau * 1000).toFixed(2)} ms`, primary: true },
          { label: "Time to 99.3% Steady Current (5τ)", value: `${(tau * 5 * 1000).toFixed(2)} ms` }
        ],
        formula: "τ = L / R"
      };
    }
  },

  "friction-force-calculator": {
    fields: [
      { id: "massKg", label: "Object Mass (m in kg)", type: "number", default: "60" },
      { id: "frictionCoeff", label: "Friction Coefficient (μ) (e.g. Rubber on concrete ~0.8)", type: "number", default: "0.65", step: "0.01" }
    ],
    note: "Calculates normal force and maximum static / kinetic frictional resistance.",
    compute(v) {
      const m = num(v.massKg, "Mass", { min: 0 });
      const mu = num(v.frictionCoeff, "Coefficient", { min: 0 });
      const normalForce = m * 9.80665;
      const fFriction = mu * normalForce;
      return {
        results: [
          { label: "Frictional Resistance Force", value: `${fFriction.toFixed(1)} N (${(fFriction * 0.224809).toFixed(1)} lbf)`, primary: true },
          { label: "Normal Force (F_N)", value: `${normalForce.toFixed(1)} N` }
        ],
        formula: "F_friction = μ × F_normal"
      };
    }
  },

  "inductor-energy-calculator": {
    fields: [
      { id: "inductanceMh", label: "Inductance (L in mH)", type: "number", default: "150" },
      { id: "currentAmps", label: "Current (I in Amperes)", type: "number", default: "3.5" }
    ],
    note: "Calculates energy stored in an inductor's magnetic field E = ½ L I².",
    compute(v) {
      const l = num(v.inductanceMh, "Inductance", { min: 0 }) / 1000;
      const i = num(v.currentAmps, "Current");
      const energy = 0.5 * l * (i * i);
      return {
        results: [
          { label: "Stored Magnetic Energy", value: `${(energy * 1000).toFixed(2)} mJ (${energy.toFixed(5)} J)`, primary: true }
        ],
        formula: "E = ½ L I²"
      };
    }
  },

  "resistor-color-code-4band": {
    fields: [
      { id: "band1", label: "1st Digit Band", type: "select", default: "1", choices: [["0","Black (0)"],["1","Brown (1)"],["2","Red (2)"],["3","Orange (3)"],["4","Yellow (4)"],["5","Green (5)"],["6","Blue (6)"],["7","Violet (7)"],["8","Gray (8)"],["9","White (9)"]] },
      { id: "band2", label: "2nd Digit Band", type: "select", default: "0", choices: [["0","Black (0)"],["1","Brown (1)"],["2","Red (2)"],["3","Orange (3)"],["4","Yellow (4)"],["5","Green (5)"],["6","Blue (6)"],["7","Violet (7)"],["8","Gray (8)"],["9","White (9)"]] },
      { id: "multiplier", label: "Multiplier Band", type: "select", default: "2", choices: [["0","Black (×1)"],["1","Brown (×10)"],["2","Red (×100)"],["3","Orange (×1k)"],["4","Yellow (×10k)"],["5","Green (×100k)"],["6","Blue (×1M)"]] },
      { id: "tolerance", label: "Tolerance Band", type: "select", default: "5", choices: [["1","Brown (±1%)"],["2","Red (±2%)"],["5","Gold (±5%)"],["10","Silver (±10%)"]] }
    ],
    note: "Decodes standard 4-band through-hole resistor color stripes.",
    compute(v) {
      const d1 = Number(v.band1);
      const d2 = Number(v.band2);
      const mult = Math.pow(10, Number(v.multiplier));
      const ohms = ((d1 * 10) + d2) * mult;
      let formatted = `${ohms} Ω`;
      if (ohms >= 1e6) formatted = `${(ohms / 1e6).toFixed(2)} MΩ`;
      else if (ohms >= 1e3) formatted = `${(ohms / 1e3).toFixed(2)} kΩ`;
      return {
        results: [
          { label: "Nominal Resistance", value: formatted, primary: true },
          { label: "Tolerance", value: `±${v.tolerance}%` },
          { label: "Exact Ohms", value: `${ohms.toLocaleString()} Ω` }
        ],
        formula: "R = (Band1 × 10 + Band2) × Multiplier"
      };
    }
  },

  "resistor-color-code-5band": {
    fields: [
      { id: "band1", label: "1st Digit Band", type: "select", default: "4", choices: [["1","Brown (1)"],["2","Red (2)"],["3","Orange (3)"],["4","Yellow (4)"],["5","Green (5)"],["6","Blue (6)"],["7","Violet (7)"],["8","Gray (8)"],["9","White (9)"]] },
      { id: "band2", label: "2nd Digit Band", type: "select", default: "7", choices: [["0","Black (0)"],["1","Brown (1)"],["2","Red (2)"],["3","Orange (3)"],["4","Yellow (4)"],["5","Green (5)"],["6","Blue (6)"],["7","Violet (7)"],["8","Gray (8)"],["9","White (9)"]] },
      { id: "band3", label: "3rd Digit Band", type: "select", default: "0", choices: [["0","Black (0)"],["1","Brown (1)"],["2","Red (2)"],["3","Orange (3)"],["4","Yellow (4)"],["5","Green (5)"],["6","Blue (6)"],["7","Violet (7)"],["8","Gray (8)"],["9","White (9)"]] },
      { id: "multiplier", label: "Multiplier Band", type: "select", default: "1", choices: [["0","Black (×1)"],["1","Brown (×10)"],["2","Red (×100)"],["3","Orange (×1k)"],["4","Yellow (×10k)"],["5","Green (×100k)"],["6","Blue (×1M)"]] },
      { id: "tolerance", label: "Tolerance Band", type: "select", default: "1", choices: [["0.5","Green (±0.5%)"],["1","Brown (±1%)"],["2","Red (±2%)"],["5","Gold (±5%)"]] }
    ],
    note: "Decodes high-precision 5-band 1% tolerance resistor color stripes.",
    compute(v) {
      const d1 = Number(v.band1);
      const d2 = Number(v.band2);
      const d3 = Number(v.band3);
      const mult = Math.pow(10, Number(v.multiplier));
      const ohms = ((d1 * 100) + (d2 * 10) + d3) * mult;
      let formatted = `${ohms} Ω`;
      if (ohms >= 1e6) formatted = `${(ohms / 1e6).toFixed(2)} MΩ`;
      else if (ohms >= 1e3) formatted = `${(ohms / 1e3).toFixed(2)} kΩ`;
      return {
        results: [
          { label: "Precision Resistance", value: formatted, primary: true },
          { label: "Tolerance", value: `±${v.tolerance}%` },
          { label: "Exact Ohms", value: `${ohms.toLocaleString()} Ω` }
        ],
        formula: "R = (B1 × 100 + B2 × 10 + B3) × Multiplier"
      };
    }
  }
};
