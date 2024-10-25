
export function millisecondsToTime(millis: number): string {
    let seconds = (millis / 1000) | 0;
    let minutes = (seconds / 60) | 0;
    let hours = (minutes / 60) | 0;
    seconds -= minutes * 60;
    minutes -= hours * 60;
    if (hours) {
        return hours + ':' + `${minutes}`.padStart(2, '0') + ':' + `${seconds}`.padStart(2, '0');
    }
    return minutes + ':' + `${seconds}`.padStart(2, '0');
}
