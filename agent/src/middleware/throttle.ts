import { Request, Response, NextFunction } from "express";

interface ThrottleOptions {
  maxConcurrency: number;
  maxQueueSize: number;
  queueTimeoutMs: number;
}

export function createThrottle(opts: ThrottleOptions) {
  let active = 0;
  const queue: Array<{
    resolve: () => void;
    reject: (err: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }> = [];

  function release() {
    active--;
    const next = queue.shift();
    if (next) {
      clearTimeout(next.timer);
      active++;
      next.resolve();
    }
  }

  return function throttle(req: Request, res: Response, next: NextFunction) {
    if (active < opts.maxConcurrency) {
      active++;
      res.on("finish", release);
      next();
      return;
    }

    if (queue.length >= opts.maxQueueSize) {
      res.status(503).json({ error: "Server busy, please try again later." });
      return;
    }

    const entry = {} as (typeof queue)[number];

    entry.timer = setTimeout(() => {
      const idx = queue.indexOf(entry);
      if (idx !== -1) queue.splice(idx, 1);
      entry.reject(new Error("queue_timeout"));
    }, opts.queueTimeoutMs);

    const waiting = new Promise<void>((resolve, reject) => {
      entry.resolve = resolve;
      entry.reject = reject;
    });

    queue.push(entry);

    waiting
      .then(() => {
        res.on("finish", release);
        next();
      })
      .catch(() => {
        if (!res.headersSent) {
          res
            .status(504)
            .json({ error: "Request timed out in queue. Please try again." });
        }
      });
  };
}
