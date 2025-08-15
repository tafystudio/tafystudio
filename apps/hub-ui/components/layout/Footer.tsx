export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              © 2024 Tafy Studio • Apache 2.0 License
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <a
              href="https://github.com/tafystudio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-tafy-600 transition-colors"
            >
              GitHub
            </a>
            <a
              href="/docs"
              className="text-sm text-gray-600 hover:text-tafy-600 transition-colors"
            >
              Documentation
            </a>
            <span className="text-sm text-gray-500">
              Time to First Motion: <span className="font-bold text-tafy-600">{'<'} 30 min</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}