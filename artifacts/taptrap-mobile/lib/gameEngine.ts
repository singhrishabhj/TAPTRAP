export interface DotPosition {
  x: number;
  y: number;
}

export interface ZoneArea {
  startAngle: number;
  endAngle: number;
  width: number;
}

export type Pattern = "circular" | "figure8" | "bounce" | "pulse" | "zigzag";

export function getDotPosition(
  angle: number,
  pattern: Pattern,
  phase: number,
  radius: number
): DotPosition {
  switch (pattern) {
    case "circular":
      return {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      };
    case "figure8":
      return {
        x: radius * Math.sin(angle),
        y: radius * 0.6 * Math.sin(2 * angle),
      };
    case "bounce":
      return {
        x: radius * Math.cos(angle * 0.5),
        y: radius * Math.abs(Math.sin(angle)),
      };
    case "pulse": {
      const pulseRadius = radius * (0.7 + 0.3 * Math.sin(phase * 3));
      return {
        x: pulseRadius * Math.cos(angle),
        y: pulseRadius * Math.sin(angle),
      };
    }
    case "zigzag": {
      const zigzag = Math.floor(angle / (Math.PI / 4)) % 2 === 0 ? 1 : -1;
      return {
        x: radius * Math.cos(angle),
        y: radius * 0.5 * zigzag,
      };
    }
    default:
      return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  }
}

export function getSpeedForScore(score: number, isZen: boolean): number {
  const base = isZen ? 0.01 : 0.018;
  const increment = isZen ? 0.0004 : 0.001;
  const max = isZen ? 0.045 : 0.09;
  return Math.min(base + score * increment, max);
}

export function getPatternForScore(score: number): Pattern {
  if (score < 5) return "circular";
  if (score < 12) return "figure8";
  if (score < 20) return "bounce";
  if (score < 30) return "pulse";
  return "zigzag";
}

export function generateTapZones(
  score: number,
  currentAngle: number,
  isZen: boolean
): ZoneArea[] {
  const numZones = isZen ? 3 : score < 15 ? 2 : 1;
  const zoneWidth = isZen ? 0.6 : Math.max(0.15, 0.4 - score * 0.008);

  const zones: ZoneArea[] = [];
  for (let i = 0; i < numZones; i++) {
    const offset = (i / numZones) * Math.PI * 2;
    const startAngle =
      currentAngle + offset + (Math.random() - 0.5) * 0.5;
    zones.push({
      startAngle,
      endAngle: startAngle + zoneWidth,
      width: zoneWidth,
    });
  }
  return zones;
}

export function generateFakeZones(
  score: number,
  realZones: ZoneArea[]
): ZoneArea[] {
  if (score < 8) return [];
  const numFakes = score < 15 ? 1 : score < 25 ? 2 : 3;
  const fakes: ZoneArea[] = [];

  for (let i = 0; i < numFakes; i++) {
    let attempts = 0;
    while (attempts < 20) {
      const angle = Math.random() * Math.PI * 2;
      const overlap = realZones.some(
        (z) =>
          Math.abs(angle - z.startAngle) < 0.4 ||
          Math.abs(angle - z.endAngle) < 0.4
      );
      if (!overlap) {
        fakes.push({ startAngle: angle, endAngle: angle + 0.2, width: 0.2 });
        break;
      }
      attempts++;
    }
  }
  return fakes;
}

export function checkTapZone(
  angle: number,
  zones: ZoneArea[],
  tolerance: number = 0
): boolean {
  const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return zones.some((zone) => {
    const start = zone.startAngle - tolerance;
    const end = zone.endAngle + tolerance;
    const zoneStart = ((start % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const zoneEnd = ((end % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    if (zoneStart <= zoneEnd) {
      return normalizedAngle >= zoneStart && normalizedAngle <= zoneEnd;
    } else {
      return normalizedAngle >= zoneStart || normalizedAngle <= zoneEnd;
    }
  });
}
