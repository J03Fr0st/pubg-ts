import { PubgValidationError } from '../../errors';

export function categorizeItem(itemId: string): string {
  if (itemId.includes('Weapon')) return 'weapon';
  if (itemId.includes('Heal') || itemId.includes('Boost')) return 'consumable';
  if (itemId.includes('Attach')) return 'attachment';
  if (itemId.includes('Armor') || itemId.includes('Back')) return 'equipment';
  if (itemId.includes('Ammo')) return 'ammunition';
  return 'other';
}

export function subcategorizeItem(itemId: string): string {
  if (
    itemId.includes('AR') ||
    itemId.includes('AK') ||
    itemId.includes('M416') ||
    itemId.includes('SCAR')
  ) {
    return 'assault_rifle';
  }
  if (itemId.includes('SMG') || itemId.includes('UMP') || itemId.includes('Vector')) return 'smg';
  if (itemId.includes('SR') || itemId.includes('Kar98') || itemId.includes('AWM')) {
    return 'sniper_rifle';
  }
  if (itemId.includes('Shotgun') || itemId.includes('S686') || itemId.includes('S1897')) {
    return 'shotgun';
  }
  if (itemId.includes('Pistol') || itemId.includes('P92') || itemId.includes('P1911')) {
    return 'pistol';
  }

  if (itemId.includes('Bandage')) return 'healing';
  if (itemId.includes('FirstAid')) return 'healing';
  if (itemId.includes('MedKit')) return 'healing';
  if (itemId.includes('Drink') || itemId.includes('Pill')) return 'boost';

  if (itemId.includes('Upper')) return 'sight';
  if (itemId.includes('Lower')) return 'grip';
  if (itemId.includes('Muzzle')) return 'muzzle';
  if (itemId.includes('Magazine')) return 'magazine';

  return 'general';
}

export function categorizeVehicle(vehicleId: string): string {
  if (vehicleId.includes('Motorbike') || vehicleId.includes('Motorcycle')) return 'two_wheeler';
  if (vehicleId.includes('Car') || vehicleId.includes('Pickup') || vehicleId.includes('Van')) {
    return 'four_wheeler';
  }
  if (vehicleId.includes('Boat') || vehicleId.includes('Ship')) return 'watercraft';
  if (vehicleId.includes('Plane') || vehicleId.includes('Glider')) return 'aircraft';
  return 'unknown';
}

export function humanizeItemId(itemId: string): string {
  return itemId
    .replace(/^Item_/, '')
    .replace(/_C$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function humanizeVehicleId(vehicleId: string): string {
  return vehicleId
    .replace(/^BP_/, '')
    .replace(/_\d+_C$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function humanizeMapId(mapId: string): string {
  return mapId.replace(/([A-Z])/g, ' $1').trim();
}

export function humanizeSeasonId(seasonId: string): string {
  const parts = seasonId.split('.');
  const lastPart = parts[parts.length - 1];
  const match = lastPart.match(/(\w+)-(\d{4})-(\d{2})/);

  if (match) {
    const [, platform, year, season] = match;
    return `${platform.toUpperCase()} Season ${parseInt(season, 10)} (${year})`;
  }

  return seasonId;
}

export function parseDate(dateStr: string): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new PubgValidationError('Invalid date string provided', {
      operation: 'parse_date',
      metadata: { providedDate: dateStr },
    });
  }

  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    throw new PubgValidationError(`Invalid date format '${dateStr}'. Expected MM-DD-YYYY format`, {
      operation: 'parse_date',
      metadata: { providedDate: dateStr, format: 'MM-DD-YYYY' },
    });
  }

  const [month, day, year] = parts.map(Number);
  if (Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(year)) {
    throw new PubgValidationError(
      `Invalid date components in '${dateStr}'. All parts must be numeric`,
      { operation: 'parse_date', metadata: { month, day, year } }
    );
  }

  return new Date(year, month - 1, day);
}

export function isSeasonActive(startDate: string, endDate: string): boolean {
  if (endDate === '00-00-0000') return true;

  const now = new Date();
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  return start <= now && now <= end;
}

export function isRatingInRange(rating: number, range: string | number): boolean {
  const rangeStr = String(range);

  if (rangeStr.includes('+')) {
    const minRating = parseInt(rangeStr.replace('+', ''), 10);
    return rating >= minRating;
  }

  if (rangeStr.includes('-')) {
    const [min, max] = rangeStr.split('-').map(Number);
    return rating >= min && rating <= max;
  }

  const exactNumber = parseInt(rangeStr, 10);
  if (!Number.isNaN(exactNumber)) {
    return rating === exactNumber;
  }

  return false;
}

export function cleanItemId(itemId: string): string {
  return itemId
    .replace(/^Item_/, '')
    .replace(/^BP_/, '')
    .replace(/_\d+_C$/, '')
    .replace(/_C$/, '');
}

export function buildAssetUrl(
  assetBaseUrl: string,
  category: string,
  itemId: string,
  type: 'icon' | 'image' = 'icon'
): string {
  return `${assetBaseUrl}/assets/${category}/${type}s/${cleanItemId(itemId)}.png`;
}
