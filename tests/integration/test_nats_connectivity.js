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

    // Create subscription
    const sub = nc.subscribe(subject);
    
    // Publish message
    nc.publish(subject, JSON.stringify(testMessage));

    // Wait for message
    const msg = await sub.next();
    const received = JSON.parse(msg.data);
    
    expect(received).toEqual(testMessage);
  });
});