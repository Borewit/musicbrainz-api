import Debug from 'debug';

const debug = Debug('musicbrainz-api:rate-limiter');

export class RateLimiter {

  public static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public queue: number[] = [];
  private readonly period: number;

  public constructor(private maxCalls: number, period: number) {
    debug(`Rate limiter initialized with max ${maxCalls} calls in ${period} seconds.`);
    this.period = 1000 * period;
  }

  public async limit(): Promise<void> {
    let now = new Date().getTime();
    const t0 = now - (this.period);
    while (this.queue.length > 0 && this.queue[0] < t0) {
      this.queue.shift();
    }
    // debug(`Current rate is  ${this.queue.length} per ${this.period / 1000} sec`);
    if (this.queue.length >= this.maxCalls) {
      const delay = this.queue[0] + this.period - now;
      debug(`Client side rate limiter activated: cool down for ${delay / 1000} s...`);
      return RateLimiter.sleep(delay);
    }
    now = new Date().getTime();
    this.queue.push(now);
    // const ratePerSec = 1000 * this.queue.length / (now - this.queue[0]);
  }

}
