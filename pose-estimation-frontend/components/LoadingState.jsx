export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
      <div className="pacman-loader mb-6">
        <div className="pacman">
          <div className="pacman-top"></div>
          <div className="pacman-bottom"></div>
        </div>
        <div className="dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>

      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 animate-pulse">{message}</h3>
      <p className="text-gray-600 dark:text-gray-300 max-w-md text-center">
        Please wait while we process your request.
      </p>

      <div className="mt-4 w-64 bg-blue-100 rounded-full h-2 overflow-hidden">
        <div className="bg-blue-600 h-2 animate-progress"></div>
      </div>
    </div>
  )
}
