const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

interface MongoDuplicateError {
  code?: number;
  keyPattern?: Record<string, number>;
}

export const isDuplicateKeyError = (err: unknown): boolean => {
  return (err as MongoDuplicateError)?.code === MONGO_DUPLICATE_KEY_ERROR_CODE;
};

export const getDuplicatedField = (err: unknown): string => {
  const mongoError = err as MongoDuplicateError;
  return Object.keys(mongoError?.keyPattern ?? {})[0] ?? 'unknown';
};
