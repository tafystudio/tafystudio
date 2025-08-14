const { connect } = require('nats');

describe('NATS Connectivity', () => {
  let nc;

  beforeAll(async () => {
    // Connect to NATS
    nc = await connect({ servers: 'localhost:4222' });
  });

  afterAll(async () => {
    // Close connection
    await nc.drain();
  });

  test('should connect to NATS server', async () => {
    expect(nc.isClosed()).toBe(false);
  });

  test('should publish and subscribe to messages', async () => {
    const subject = 'test.integration';
    const testMessage = { test: 'data', timestamp: Date.now() };

    // Create a promise to wait for the message
    const messageReceived = new Promise((resolve) => {
      // Subscribe with a callback
      nc.subscribe(subject, {
        callback: (err, msg) => {
          if (err) {
            resolve(err);
          } else {
            const received = JSON.parse(msg.data.toString());
            resolve(received);
          }
        },
        max: 1
      });
    });
    
    // Publish message after subscription is set up
    setTimeout(() => {
      nc.publish(subject, JSON.stringify(testMessage));
    }, 100);

    // Wait for message
    const received = await messageReceived;
    
    expect(received).toEqual(testMessage);
  });
});