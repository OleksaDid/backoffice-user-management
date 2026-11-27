import { pino } from 'pino';
import { describe, expect, it, vi } from 'vitest';

import { AppError } from '../errors/app-error.js';
import { LoggerErrorReporter } from './error-reporter.js';

function setup() {
  const logger = pino({ level: 'silent' });
  const info = vi.spyOn(logger, 'info');
  const error = vi.spyOn(logger, 'error');
  return { reporter: new LoggerErrorReporter(logger), info, error };
}

describe('LoggerErrorReporter', () => {
  it('ERR-12 logs expected client errors at info level with their code', () => {
    const { reporter, info, error } = setup();
    reporter.report(new AppError('USER_NOT_FOUND'), { source: 'request', requestId: 'r1' });
    expect(error).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'USER_NOT_FOUND', status: 404, requestId: 'r1' }),
      'The user does not exist.',
    );
  });

  it('ERR-12 reports unexpected errors at error level with the stack', () => {
    const { reporter, error } = setup();
    const boom = new Error('boom');
    reporter.report(boom, { source: 'process' });
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ err: boom }), 'boom');
  });

  it('ERR-12 treats 5xx application errors as incidents', () => {
    const { reporter, error } = setup();
    reporter.report(new AppError('SERVICE_UNAVAILABLE'), { source: 'request' });
    expect(error).toHaveBeenCalledOnce();
  });

  it('ERR-12 wraps non-Error throwables', () => {
    const { reporter, error } = setup();
    reporter.report('plain string', { source: 'process' });
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) as Error }),
      'plain string',
    );
  });
});
