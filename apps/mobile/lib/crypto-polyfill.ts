import { Crypto } from '@peculiar/webcrypto';
import 'react-native-get-random-values';

const g = globalThis as typeof globalThis & { crypto?: Crypto };

if (!g.crypto?.subtle) {
  Object.defineProperty(g, 'crypto', {
    value: new Crypto(),
    configurable: true,
    enumerable: true,
    writable: true,
  });
}
