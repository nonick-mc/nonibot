function getHourInJst() {
  return Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', hour: 'numeric', hourCycle: 'h23' })
      .formatToParts(new Date())
      .find((part) => part.type === 'hour')?.value,
  );
}

/** 現在時刻が開始〜終了の期間内かどうか判定する */
export function isActivePeriod({ startHour, endHour }: { startHour: number; endHour: number }) {
  const hour = getHourInJst();
  return startHour < endHour
    ? hour >= startHour && hour < endHour
    : hour >= startHour || hour < endHour;
}
