export function ShareBadge() {
  return (
    <div
      className="flex justify-center mb-6"
      data-testid="share-badge-container"
    >
      <div
        className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium border border-gray-200"
        data-testid="share-badge"
      >
        <div
          className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
          data-testid="status-indicator"
        ></div>
        シェアされた講評結果
      </div>
    </div>
  );
}
