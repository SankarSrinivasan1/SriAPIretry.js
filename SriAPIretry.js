class SriApiRetry {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || 3;
    this.backoffStrategy = options.backoffStrategy || 'exponential';
    this.retryableErrors = options.retryableErrors || [];
  }

  async request(url, options = {}) {
    let attempts = 0;
    let backoffTime = 0;

    while (attempts < this.maxAttempts) {
      try {
        const response = await fetch(url, options);

        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`HTTP error: ${response.status}`);
        }
      } catch (error) {
        const isRetryableError = this.retryableErrors.some((retryError) =>
          error.message.includes(retryError)
        );

        if (!isRetryableError || attempts === this.maxAttempts - 1) {
          throw error;
        }

        attempts++;

        if (this.backoffStrategy === 'exponential') {
          backoffTime = this.calculateExponentialBackoff(backoffTime, attempts);
        } else if (this.backoffStrategy === 'linear') {
          backoffTime = this.calculateLinearBackoff(backoffTime);
        }

        await this.delay(backoffTime);
      }
    }

    throw new Error(`Max retry attempts reached (${this.maxAttempts})`);
  }

  calculateExponentialBackoff(backoffTime, attempts) {
    const baseTime = 1000; // 1 second
    const maxBackoffTime = 60000; // 1 minute
    const backoffFactor = 2;

    const calculatedBackoffTime = Math.min(
      baseTime * Math.pow(backoffFactor, attempts - 1),
      maxBackoffTime
    );

    return backoffTime + calculatedBackoffTime;
  }

  calculateLinearBackoff(backoffTime) {
    const baseTime = 1000; // 1 second
    const maxBackoffTime = 60000; // 1 minute
    const backoffIncrement = 1000; // 1 second

    const calculatedBackoffTime = Math.min(backoffTime + backoffIncrement, maxBackoffTime);

    return calculatedBackoffTime;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

