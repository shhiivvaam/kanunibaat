import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  lawyerDocumentObjectKey,
  parseS3DocumentsConfigFromEnv,
  vaultDocumentObjectKey,
} from './index.js';

void describe('parseS3DocumentsConfigFromEnv', () => {
  void it('returns null when any required field is missing', () => {
    assert.equal(parseS3DocumentsConfigFromEnv({}), null);
    assert.equal(
      parseS3DocumentsConfigFromEnv({
        AWS_REGION: 'ap-south-1',
        AWS_S3_BUCKET: 'bucket',
      }),
      null,
    );
  });

  void it('returns config when all fields are set', () => {
    const cfg = parseS3DocumentsConfigFromEnv({
      AWS_REGION: ' ap-south-1 ',
      AWS_S3_BUCKET: 'my-bucket',
      AWS_ACCESS_KEY_ID: 'key',
      AWS_SECRET_ACCESS_KEY: 'secret',
    });
    assert.ok(cfg);
    assert.equal(cfg.region, 'ap-south-1');
    assert.equal(cfg.bucket, 'my-bucket');
    assert.equal(cfg.accessKeyId, 'key');
    assert.equal(cfg.secretAccessKey, 'secret');
  });
});

void describe('object key helpers', () => {
  void it('sanitizes lawyer document filenames', () => {
    const key = lawyerDocumentObjectKey('user-1', 'doc-1', 'my file (1).pdf');
    assert.equal(key, 'lawyer-docs/user-1/doc-1/my_file_1_.pdf');
  });

  void it('builds deterministic vault blob key', () => {
    assert.equal(
      vaultDocumentObjectKey('user-1', '00000000-0000-0000-0000-000000000001'),
      'vault/user-1/00000000-0000-0000-0000-000000000001/blob',
    );
  });
});
