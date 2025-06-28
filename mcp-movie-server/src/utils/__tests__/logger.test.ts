import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Logger } from '../logger.js';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logger = new Logger('debug');
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('debug', () => {
    it('should log debug messages when level is debug', () => {
      logger.debug('test message');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DEBUG: test message'));
    });

    it('should not log debug messages when level is info', () => {
      const infoLogger = new Logger('info');
      infoLogger.debug('test message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('test message');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('INFO: test message'));
    });
  });

  describe('warn', () => {
    it('should log warn messages', () => {
      logger.warn('test message');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('WARN: test message'));
    });
  });

  describe('error', () => {
    it('should log error messages with error details', () => {
      const error = new Error('test error');
      logger.error('test message', error);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR: test message'));
    });

    it('should log error messages without error details', () => {
      logger.error('test message');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR: test message'));
    });
  });

  describe('context', () => {
    it('should include context in log messages', () => {
      logger.info('test message', { key: 'value' });
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('{"key":"value"}'));
    });
  });
}); 