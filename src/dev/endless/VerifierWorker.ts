import {
  verifyEndlessSelectionEntry,
} from './VerifierEntry';
import type {
  EndlessSelectionRecord,
  EndlessVerificationFailure,
} from './types';

interface VerifyWorkerRequest {
  readonly chunkIndex: number;
  readonly entries: readonly EndlessSelectionRecord[];
}

interface VerifyWorkerSuccess {
  readonly chunkIndex: number;
  readonly failures: readonly EndlessVerificationFailure[];
}

interface VerifyWorkerFailure {
  readonly chunkIndex: number;
  readonly error: string;
}

if (typeof process.send !== 'function') {
  throw new Error(
    'Endless verifier child must run with an IPC channel.',
  );
}

process.on(
  'message',
  (message: unknown) => {
    const request = message as VerifyWorkerRequest;
    try {
      const failures: EndlessVerificationFailure[] = [];
      for (const entry of request.entries) {
        failures.push(
          ...verifyEndlessSelectionEntry(entry),
        );
      }
      const response: VerifyWorkerSuccess = {
        chunkIndex: request.chunkIndex,
        failures,
      };
      process.send?.(response);
    } catch (error: unknown) {
      const response: VerifyWorkerFailure = {
        chunkIndex: request.chunkIndex,
        error:
          error instanceof Error
            ? `${error.name}: ${error.message}\n${error.stack ?? ''}`
            : String(error),
      };
      process.send?.(response);
    }
  },
);
