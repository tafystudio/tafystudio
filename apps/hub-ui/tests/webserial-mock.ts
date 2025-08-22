// Mock WebSerial API for testing without hardware
export class MockSerialPort {
  private _readable: ReadableStream;
  private _writable: WritableStream;
  private _isOpen = false;

  constructor() {
    // Create mock readable stream
    this._readable = new ReadableStream({
      start(controller) {
        // Simulate device responses
        setTimeout(() => {
          controller.enqueue(new TextEncoder().encode('ESP32 Ready\r\n'));
        }, 100);
      }
    });

    // Create mock writable stream
    this._writable = new WritableStream({
      write(chunk) {
        console.log('Mock write:', new TextDecoder().decode(chunk));
      }
    });
  }

  async open(options: SerialOptions): Promise<void> {
    console.log('Mock open with options:', options);
    this._isOpen = true;
  }

  async close(): Promise<void> {
    console.log('Mock close');
    this._isOpen = false;
  }

  get readable() {
    return this._readable;
  }

  get writable() {
    return this._writable;
  }

  getInfo() {
    return {
      usbVendorId: 0x10c4,
      usbProductId: 0xea60
    };
  }
}

export class MockSerial {
  private ports: MockSerialPort[] = [];

  async requestPort(options?: SerialPortRequestOptions): Promise<MockSerialPort> {
    console.log('Mock requestPort:', options);
    const port = new MockSerialPort();
    this.ports.push(port);
    return port;
  }

  async getPorts(): Promise<MockSerialPort[]> {
    return this.ports;
  }
}

// Helper to inject mock into page
export async function injectWebSerialMock(page: any) {
  await page.addInitScript(() => {
    // Only mock if WebSerial doesn't exist
    if (!('serial' in navigator)) {
      console.log('Injecting WebSerial mock');
      (window.navigator as any).serial = new (window as any).MockSerial();
    }
  });

  // Inject mock classes
  await page.evaluate(`
    (window as any).MockSerialPort = ${MockSerialPort.toString()};
    (window as any).MockSerial = ${MockSerial.toString()};
  `);
}