import { Storage } from '@google-cloud/storage';

const globalForGCS = globalThis as unknown as {
  storageClient: Storage | undefined;
};

export const storageClient = globalForGCS.storageClient ?? new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    // Ensure private keys with escaped newlines from .env are parsed correctly
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

if (process.env.NODE_ENV !== 'production') globalForGCS.storageClient = storageClient;

export const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'mha-creative-studio';
