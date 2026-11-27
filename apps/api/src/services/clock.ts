/** Source of the current time, injected so tests can control it. */
export type Clock = () => Date;

export const systemClock: Clock = () => new Date();
