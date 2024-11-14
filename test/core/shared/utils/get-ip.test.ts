import { getIP } from '@/core/src/shared/utils';
import { expect, describe, it, vi } from 'vitest';
import os from 'os';

describe('getIP', () => {
  it('should return input string when valid IP string is provided', () => {
    expect(getIP('192.168.1.1')).toBe('192.168.1.1');
  });

  it('should return localhost when empty string is provided', () => {
    expect(getIP('')).toBe('localhost');
  });

  it('should return localhost when false is provided', () => {
    expect(getIP(false)).toBe('localhost');
  });

  it('should return first valid IPv4 address when true is provided', () => {
    const mockNetworkInterfaces = {
      'eth0': [
        {
          family: 'IPv4',
          address: '192.168.1.100',
          internal: false
        },
        {
          family: 'IPv6',
          address: 'fe80::1',
          internal: false
        }
      ],
      'lo': [
        {
          family: 'IPv4',
          address: '127.0.0.1',
          internal: true
        }
      ]
    };

    vi.mock('os')
    vi.mocked(os.networkInterfaces).mockReturnValue(mockNetworkInterfaces as any);
    expect(getIP(true)).toBe('192.168.1.100');
  });

  it('should return localhost when no valid IPv4 address is found', () => {
    const mockNetworkInterfaces = {
      'lo': [
        {
          family: 'IPv4',
          address: '127.0.0.1',
          internal: true
        }
      ]
    };

    vi.mock('os')
    vi.mocked(os.networkInterfaces).mockReturnValue(mockNetworkInterfaces as any);
    expect(getIP(true)).toBe('localhost');
  });
});


