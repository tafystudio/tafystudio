export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-tafy-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-tafy-900 mb-4">
            Tafy Studio Hub
          </h1>
          <p className="text-xl text-tafy-700 mb-8">
            Robot Distributed Operation System
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-tafy-800 mb-2">
                🤖 Devices
              </h2>
              <p className="text-gray-600">
                Discover and manage connected robots and sensors
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-tafy-800 mb-2">
                📊 Flows
              </h2>
              <p className="text-gray-600">
                Create and deploy visual robot behaviors
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-tafy-800 mb-2">
                🔧 System
              </h2>
              <p className="text-gray-600">
                Monitor health and configure your cluster
              </p>
            </div>
          </div>
          
          <div className="mt-16">
            <p className="text-sm text-gray-500">
              Time to First Motion: <span className="font-bold text-tafy-600">{"<"} 30 minutes</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}